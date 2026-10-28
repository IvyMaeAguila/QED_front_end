import { useState } from "react";
import { ForgotPasswordModal } from "../../shared/components/manage_password/ForgotPasswordModal";
import { OtpVerificationModal } from "../../shared/components/manage_password/OtpVerificationModal";
import { ResetPasswordModal } from "../../shared/components/manage_password/ResetPasswordModal";

/** Load account recovery only after the user asks to reset their password. */
export function LoginRecoveryFlow({onClose}:{onClose:()=>void}) {
  const [step,setStep]=useState<'email'|'otp'|'reset'>('email');
  const [userName,setUserName]=useState('');
  const [email,setEmail]=useState('');
  const [resetToken,setResetToken]=useState('');
  if(step==='email')return <ForgotPasswordModal onClose={onClose} onOtpSent={(name,address)=>{setUserName(name);setEmail(address);setStep('otp');}}/>;
  if(step==='otp')return <OtpVerificationModal userName={userName} email={email} onClose={onClose} onResend={()=>setStep('email')} onVerified={token=>{setResetToken(token);setStep('reset');}}/>;
  return <ResetPasswordModal resetToken={resetToken} onClose={onClose} onSuccess={onClose}/>;
}
