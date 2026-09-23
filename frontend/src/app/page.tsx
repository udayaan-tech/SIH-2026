"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./svgs/svg-icon";
import Logo, { type LogoData } from "./components/logo";
import Icon2 from "./svgs/svg-icon2";
import Tile, { type TileData } from "./components/tile";
import Icon3 from "./svgs/svg-icon3";
import { Logo_cids, Tile_cids } from "./_cids";

const Logo_data: LogoData[] = [
    { xcolumn: "478", xcomponent: "Fingerprint", xid: "App_13_478", icon: <>
        <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
        <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
        <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
        <path d="M2 12a10 10 0 0 1 18-6" />
        <path d="M2 16h.01" />
        <path d="M21.8 16c.2-2 .131-5.354 0-6" />
        <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
        <path d="M8.65 22c.21-.66.45-1.32.57-2" />
        <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
        </>, text: " SHA-256 integrity" },
    { xcolumn: "533", xcomponent: "LockKeyhole", xid: "App_13_533", icon: <>
        <circle cx="12" cy="16" r="1" />
        <rect x="3" y="10" width="18" height="12" rx="2" />
        <path d="M7 10V7a5 5 0 0 1 10 0v3" />
        </>, text: " BSA 65B ready" },
    { xcolumn: "584", xcomponent: "Globe2", xid: "App_13_584", icon: <>
        <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" />
        <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" />
        <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" />
        <circle cx="12" cy="12" r="10" />
        </>, text: " Federated by state" }
];
const Tile_data: TileData[] = [
    { text: "Investigating Officer" },
    { text: "Forensic Expert" },
    { text: "Public Prosecutor" },
    { text: "Judge" },
    { text: "System Administrator" }
];

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "mfa">("login");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);

  function handleContinueToMFA() {
    setStep("mfa");
  }

  function handleVerifyOTP() {
    if (otp.length === 6) {
      setOtpError(false);
      router.push("/dashboard");
    } else {
      setOtpError(true);
    }
  }

  return (
    <>
      <div className="min-h-full block bg-background" data-cid="n1" id="root">
        <main className="w-full h-[903.9px] min-h-screen grid grid-cols-[1.222fr_1fr] max-md:h-[1281.3px] max-lg:grid-cols-1 md:max-lg:h-[1218.7px] 2xl:h-270" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, var(--clr-0) 0px, var(--background) 46%)" }} data-cid="n2">
          <div className="border-r border-solid border-r-clr-1 flex relative pt-24 pb-16 px-32 flex-col justify-center max-md:pt-[2.1875rem] max-md:pb-12.5 max-md:px-7.5 max-lg:border-r-[0] max-lg:border-initial max-lg:border-r-[initial] md:max-lg:py-12.5 md:max-lg:px-[3.8375rem] 2xl:pt-[8.1rem] 2xl:pb-[5.4rem] 2xl:px-48" data-cid="n3">
            <div className="w-15.5 h-15.5 border border-solid border-primary grid mb-9.5 items-center justify-items-center text-primary grid-cols-[minmax(0,_1fr)]" data-cid="n4">
              <Icon cid={"n5"} />
            </div>
            <p className="block mb-3 text-primary [font-family:'JetBrains_Mono',_monospace] text-[0.6875rem] font-semibold leading-3.5 tracking-[1.2px]" data-cid="n6">
              MINISTRY OF HOME AFFAIRS • NCRB
            </p>
            <h1 className="block mb-6 [font-family:Outfit] text-7xl font-medium leading-[4.5625rem] max-md:text-[2.75rem] max-md:leading-[2.8125rem] md:max-lg:text-[3.25rem] md:max-lg:leading-[3.3125rem]" data-cid="n7" data-component="heading">
              Justice, secured
              <br className="inline" data-cid="n8" />
              <em className="inline text-primary" data-cid="n9">
                by design.
              </em>
            </h1>
            <p className="w-full max-w-110 block text-muted-foreground text-[1.0625rem] leading-[1.8125rem]" data-cid="n10">
              A cryptographically verifiable document command center for India's justice ecosystem.
            </p>
            <div className="flex mt-13.5 gap-5.5 text-color-001 [font-family:'JetBrains_Mono'] text-xs leading-4 max-md:grid max-lg:mt-7.5 max-lg:flex-wrap max-md:gap-3 max-md:grid-cols-[315px]" data-cid="n11">
              {Logo_data.map((d, i) => <Logo key={i} d={d} cids={Logo_cids[i]} />)}
            </div>
          </div>
          <section className="flex py-24 px-[6.4rem] flex-col justify-center max-lg:py-10 max-md:px-7.5 md:max-lg:px-[3.8375rem] 2xl:py-[8.1rem] 2xl:px-[9.6rem]" data-cid="n18">
            <div className="flex mb-17.5 items-center gap-[0.5625rem] text-primary max-lg:mb-[2.1875rem]" data-cid="n19">
              <Icon2 cid={"n20"} />
              <strong className="block font-bold" data-cid="n21">
                न्याय सुरक्षा
              </strong>
              <span className="block ml-1 text-muted-foreground [font-family:'JetBrains_Mono'] text-[0.625rem] leading-[0.8125rem] tracking-[1px]" data-cid="n22">
                NYAY SURAKSHA
              </span>
            </div>
            <div className="w-full max-w-102.5 block" data-cid="n23">
              <p className="block mb-3 text-primary [font-family:'JetBrains_Mono',_monospace] text-[0.6875rem] font-semibold leading-3.5 tracking-[1.2px]" data-cid="n24">
                SECURE IDENTITY GATEWAY
              </p>

              {step === "login" && (
                <>
                  <h2 className="block mb-2 [font-family:Outfit] text-[2.375rem] font-medium leading-12 max-md:text-[2rem] max-md:leading-10" data-cid="n25" data-component="heading">
                    Welcome back
                  </h2>
                  <p className="block text-muted-foreground leading-[1.625rem]" data-cid="n26">
                    Sign in to the protected case network.
                  </p>
                  <label className="block mt-6 text-color-001 text-xs leading-4.5 cursor-default" data-cid="n27">
                    Badge number
                    <input className="w-full h-11.5 border border-solid border-accent block mt-2 py-[0.8125rem] px-3.5 overflow-clip text-foreground bg-color-003 cursor-text focus:border-primary" data-cid="n28" data-component="input" defaultValue="IO-DEL-0421" />
                  </label>
                  <label className="block mt-6 text-color-001 text-xs leading-4.5 cursor-default" data-cid="n29">
                    Password
                    <input className="w-full h-11.5 border border-solid border-accent block mt-2 py-[0.8125rem] px-3.5 overflow-clip text-foreground bg-color-003 cursor-text focus:border-primary" data-cid="n30" data-component="input" type="password" defaultValue="Nyay@2026" />
                  </label>
                  <label className="block mt-6 text-color-001 text-xs leading-4.5 cursor-default" data-cid="n31">
                    Active role
                    <select className="w-full h-[2.8125rem] border border-solid border-accent block mt-2 py-[0.8125rem] px-3.5 items-center text-foreground leading-[0.9375rem] whitespace-pre text-nowrap bg-color-003" data-cid="n32" data-component="select">
                      {Tile_data.map((d, i) => <Tile key={i} d={d} cids={Tile_cids[i]} />)}
                    </select>
                  </label>
                  <button
                    onClick={handleContinueToMFA}
                    className="w-full h-[43.5px] border border-solid border-primary inline-flex mt-7 py-[0.6875rem] px-4 justify-center items-center gap-2 text-clr-2 text-[0.8125rem] font-bold leading-[1.25rem] text-center bg-clr-3 cursor-pointer hover:bg-primary hover:transform-[matrix(1,0,0,1,0,-0.983464)] focus:bg-clr-8 focus:transform-[matrix(1,0,0,1,0,-0.0158567)]"
                    data-cid="n38"
                    data-component="button"
                  >
                    {"Continue to MFA "}
                    <Icon3 cid={"n39"} />
                  </button>
                </>
              )}

              {step === "mfa" && (
                <>
                  <h2 className="block mb-2 [font-family:Outfit] text-[2.375rem] font-medium leading-12 max-md:text-[2rem] max-md:leading-10" data-component="heading">
                    Two-Factor Auth
                  </h2>
                  <p className="block text-muted-foreground leading-[1.625rem]">
                    Enter the 6-digit TOTP code from your authenticator app.
                  </p>
                  <label className="block mt-6 text-color-001 text-xs leading-4.5 cursor-default">
                    OTP Code
                    <input
                      className={`w-full h-11.5 border border-solid block mt-2 py-[0.8125rem] px-3.5 overflow-clip text-foreground bg-color-003 cursor-text focus:border-primary tracking-[0.5em] text-center text-lg ${otpError ? "border-red-500" : "border-accent"}`}
                      data-component="input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setOtpError(false); }}
                    />
                    {otpError && (
                      <span className="block mt-1 text-red-500 text-[0.6875rem]">Enter a valid 6-digit code.</span>
                    )}
                  </label>
                  <p className="block mt-2 text-muted-foreground [font-family:'JetBrains_Mono'] text-[0.625rem] leading-[0.8125rem]">
                    Demo: any 6-digit code is accepted.
                  </p>
                  <button
                    onClick={handleVerifyOTP}
                    className="w-full h-[43.5px] border border-solid border-primary inline-flex mt-7 py-[0.6875rem] px-4 justify-center items-center gap-2 text-clr-2 text-[0.8125rem] font-bold leading-[1.25rem] text-center bg-clr-3 cursor-pointer hover:bg-primary"
                    data-component="button"
                  >
                    Verify & Sign In
                  </button>
                  <button
                    onClick={() => { setStep("login"); setOtp(""); setOtpError(false); }}
                    className="w-full mt-3 text-center text-muted-foreground [font-family:'JetBrains_Mono'] text-[0.6875rem] leading-3.5 cursor-pointer hover:text-foreground"
                  >
                    ← Back to login
                  </button>
                </>
              )}


              <div className="border border-solid border-border flex mt-6 p-3 items-center gap-2 text-clr-4 [font-family:'JetBrains_Mono'] text-[0.6875rem] leading-3.5 bg-clr-5" data-cid="n40">
                <span className="w-1.5 h-[0.4375rem] block rounded-[50%] bg-color-002 shadow-[var(--clr-6)_0px_0px_0px_3px] max-md:w-[0.3125rem] md:max-lg:w-[0.4125rem] 2xl:w-[0.4125rem]" data-cid="n41" />
                {" Demo environment · OTP prefilled · Local simulated services"}
              </div>
            </div>
            <p className="block mt-15 text-clr-7 [font-family:'JetBrains_Mono'] text-[0.625rem] leading-[0.8125rem]" data-cid="n42">
              Protected under BSA 2023 · DPDPA 2023 · CERT-In directives
            </p>
          </section>
        </main>
      </div>
      {" "}
    </>
  );
}
