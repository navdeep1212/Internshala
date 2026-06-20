import Footer from "@/Components/Fotter";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch } from "react-redux";
import { useEffect } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout } from "@/Feature/Userslice";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LanguageProvider } from "@/context/LanguageContext";
import axios from "axios";
import { getApiUrl } from "@/utils/api";

export default function App({ Component, pageProps }: AppProps) {
  function AuthListener() {
    const dispatch = useDispatch();
    
    const detectDeviceType = async () => {
      const ua = navigator.userAgent;
      if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return "mobile";
      try {
        if ("getBattery" in navigator) {
          const battery = await (navigator as any).getBattery();
          if (battery && (battery.level < 1 || !battery.charging || battery.dischargingTime !== Infinity)) {
            return "laptop";
          }
        }
      } catch (e) {}
      if (window.screen.width <= 1600) return "laptop";
      return "desktop";
    };

    useEffect(() => {
      const storedUser = localStorage.getItem("customUser");
      if (storedUser) {
        try {
          dispatch(login(JSON.parse(storedUser)));
        } catch (e) {
          console.error("Failed to parse customUser:", e);
        }
      }

      const unsubscribe = auth.onAuthStateChanged(async (authuser) => {
        if (authuser) {
          const deviceType = await detectDeviceType();
          const isNewLogin = sessionStorage.getItem("isNewLoginAttempt") === "true";
          sessionStorage.removeItem("isNewLoginAttempt");

          try {
            const res = await axios.post(
              getApiUrl("/user/google-sync"),
              {
                uid: authuser.uid,
                email: authuser.email,
                name: authuser.displayName,
                photoURL: authuser.photoURL,
                deviceType,
                isNewLoginAttempt: isNewLogin
              },
              { validateStatus: () => true }
            );

            if (res.status === 403) {
              await auth.signOut();
              dispatch(logout());
              toast.error(res.data.message || "Access blocked: Mobile logins are only allowed between 10:00 AM and 1:00 PM.");
              return;
            }

            if (res.status === 200 && res.data.otpRequired) {
              await auth.signOut();
              dispatch(logout());
              window.dispatchEvent(
                new CustomEvent("login-otp-required", {
                  detail: {
                    email: authuser.email,
                    googleData: {
                      uid: authuser.uid,
                      email: authuser.email,
                      name: authuser.displayName,
                      photoURL: authuser.photoURL
                    },
                    devMode: res.data.devMode
                  }
                })
              );
              return;
            }

            if (res.status === 200 && res.data.success) {
              localStorage.removeItem("customUser");
              dispatch(
                login({
                  uid: authuser.uid,
                  photo: authuser.photoURL,
                  name: authuser.displayName,
                  email: authuser.email,
                  phoneNumber: authuser.phoneNumber,
                })
              );
            } else {
              await auth.signOut();
              dispatch(logout());
              toast.error(res.data.message || "Failed to synchronize user.");
            }
          } catch (e) {
            console.error("Failed to sync Google user with DB:", e);
            await auth.signOut();
            dispatch(logout());
            toast.error("Failed to connect to authentication server.");
          }
        } else {
          if (!localStorage.getItem("customUser")) {
            dispatch(logout());
          }
        }
      });
      return () => unsubscribe();
    }, [dispatch]);
    return null;
  }

  return (
    <Provider store={store}>
      <LanguageProvider>
        <AuthListener />
        <div className="bg-white">
          <ToastContainer/>
          <Navbar />
          <Component {...pageProps} />
          <Footer />
        </div>
      </LanguageProvider>
    </Provider>
  );
}

