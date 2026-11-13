import React, { useState } from 'react';
import { useAuth, ROLE_CREDENTIALS, ROLE_REDIRECT_MAP } from '../../shared/context/AuthContext';
import type { Role } from '../../shared/types';
import { ThemeToggle } from '../../shared/components/ThemeToggle';
import { Shield, Stethoscope, Pill, User as UserIcon, Lock, Mail, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  onSuccess: (redirectView: string) => void;
  onBack?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBack }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Patient Registration Form State
const [regFirstName, setRegFirstName] = useState('');
const [regLastName, setRegLastName] = useState('');
const [regEmail, setRegEmail] = useState('');
const [regPassword, setRegPassword] = useState('');
const [regPhone, setRegPhone] = useState('');
const [regGender, setRegGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
const [regBloodGroup, setBloodGroup] = useState('O_POSITIVE');
const [regDateOfBirth, setRegDateOfBirth] = useState('');

const [error, setError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsSubmitting(true);

  try {
    const user = await login(loginEmail, loginPassword);
    const redirect = ROLE_REDIRECT_MAP[user.role] || 'dashboard';
    onSuccess(redirect);
  } catch (err: any) {
    setError(err.message || 'Invalid email or password');
  } finally {
    setIsSubmitting(false);
  }
};

const handleRegisterSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsSubmitting(true);

  try {
    const registeredUser = await register({
      email: regEmail,
      password: regPassword,
      firstName: regFirstName,
      lastName: regLastName,
      role: 'PATIENT', // Exclusively Patient Registration
      phoneNumber: regPhone || undefined,
      gender: regGender,
      bloodGroup: regBloodGroup,
      dateOfBirth: regDateOfBirth || undefined,
    });
    const redirect = ROLE_REDIRECT_MAP[registeredUser.role] || 'patient-overview';
    onSuccess(redirect);
  } catch (err: any) {
    setError(err.message || 'Registration failed');
  } finally {
    setIsSubmitting(false);
  }
};

const handleQuickLogin = async (roleKey: Role) => {
  setError(null);
  setIsSubmitting(true);
  const creds = ROLE_CREDENTIALS[roleKey];
  setLoginEmail(creds.email);
  setLoginPassword('Hospital123!');
  try {
    const user = await login(creds.email, 'Hospital123!');
    const redirect = ROLE_REDIRECT_MAP[user.role] || 'dashboard';
    onSuccess(redirect);
  } catch (err: any) {
    setError(err.message || `Quick login failed for ${roleKey}`);
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between items-center px-4 py-8 select-none font-sans antialiased">
    {/* Top Bar with Theme Toggle */}
    <header className="w-full max-w-md flex justify-between items-center pb-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md border border-border bg-card/60 hover:bg-secondary cursor-pointer"
            title="Return to Aura Hospital Public Portal"
          >
            <ArrowLeft size={13} />
            <span className="font-medium">Aura Hospital</span>
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded border border-border bg-card flex items-center justify-center font-mono font-bold text-xs tracking-tighter shadow-xs">
            H+
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Hospital OS • RBAC Security
          </span>
        </div>
      </div>
      <ThemeToggle />
    </header>

    {/* Main Authentication Container */}
    <main className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Clinical Authentication
        </h1>
        <p className="text-xs text-muted-foreground">
          Role-Based Access Control & Patient Verification
        </p>
      </div>

      {/* Tab Selector */}
      <div className="grid grid-cols-2 p-1 bg-muted/60 border border-border rounded-lg text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            setTab('login');
            setError(null);
          }}
          className={`py-2 rounded-md transition-all cursor-pointer ${tab === 'login'
            ? 'bg-background text-foreground shadow-xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('register');
            setError(null);
          }}
          className={`py-2 rounded-md transition-all cursor-pointer ${tab === 'register'
            ? 'bg-background text-foreground shadow-xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          New Patient Enrollment
        </button>
      </div>

      {/* Card Frame */}
      <div className="border border-border bg-card/80 backdrop-blur-md p-6 rounded-xl shadow-xl space-y-5">
        {/* Error Message */}
        {error && (
          <div className="text-xs font-mono border border-destructive/40 bg-destructive/10 text-destructive p-3 rounded-lg flex items-start justify-between gap-2">
            <span>{error}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider shrink-0">Denial</span>
          </div>
        )}

        {tab === 'login' ? (
          /* Login Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                User Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@hospital.com"
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none pl-9 pr-3.5 py-2 text-sm rounded-lg text-foreground placeholder:text-muted-foreground transition-colors font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none pl-9 pr-10 py-2 text-sm rounded-lg text-foreground placeholder:text-muted-foreground transition-colors font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-foreground text-background font-semibold text-xs py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* New Patient Enrollment Form (No Role Dropdown) */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="border border-border/80 bg-muted/30 p-2.5 rounded-lg text-[11px] text-muted-foreground space-y-0.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <UserIcon size={13} />
                <span>Patient Intake Registration</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Creates your personal health ledger with immediate access to appointments, medical charts, and prescriptions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  placeholder="Jane"
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-1.5 text-xs rounded-lg text-foreground placeholder:text-muted-foreground transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-1.5 text-xs rounded-lg text-foreground placeholder:text-muted-foreground transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-1.5 text-xs rounded-lg text-foreground placeholder:text-muted-foreground transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Password (min 6 characters) *
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none pl-3 pr-9 py-1.5 text-xs rounded-lg text-foreground placeholder:text-muted-foreground transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Gender
                </label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value as any)}
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2.5 py-1.5 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Blood Group
                </label>
                <select
                  value={regBloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2.5 py-1.5 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
                >
                  <option value="O_POSITIVE">O+</option>
                  <option value="O_NEGATIVE">O-</option>
                  <option value="A_POSITIVE">A+</option>
                  <option value="A_NEGATIVE">A-</option>
                  <option value="B_POSITIVE">B+</option>
                  <option value="B_NEGATIVE">B-</option>
                  <option value="AB_POSITIVE">AB+</option>
                  <option value="AB_NEGATIVE">AB-</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+1-555-0199"
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-1.5 text-xs rounded-lg text-foreground placeholder:text-muted-foreground transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={regDateOfBirth}
                  onChange={(e) => setRegDateOfBirth(e.target.value)}
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2 py-1.5 text-xs rounded-lg text-foreground transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-foreground text-background font-semibold text-xs py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={13} />
                  <span>Complete Patient Enrollment</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Mock Role Shortcuts */}
        <div className="pt-4 border-t border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground font-semibold">
              Quick 1-Click Role Login
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Dev Credentials</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin('ADMIN')}
              className="flex items-center gap-2 border border-border hover:border-foreground bg-muted/30 hover:bg-muted/70 p-2 rounded-lg text-left transition-all cursor-pointer group"
            >
              <Shield size={14} className="text-muted-foreground group-hover:text-foreground shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">Main Admin</div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">ataah@gmail.com</div>
              </div>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin('DOCTOR')}
              className="flex items-center gap-2 border border-border hover:border-foreground bg-muted/30 hover:bg-muted/70 p-2 rounded-lg text-left transition-all cursor-pointer group"
            >
              <Stethoscope size={14} className="text-muted-foreground group-hover:text-foreground shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">Doctor</div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">Clinical</div>
              </div>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin('PHARMACIST')}
              className="flex items-center gap-2 border border-border hover:border-foreground bg-muted/30 hover:bg-muted/70 p-2 rounded-lg text-left transition-all cursor-pointer group"
            >
              <Pill size={14} className="text-muted-foreground group-hover:text-foreground shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">Pharmacist</div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">Dispensary</div>
              </div>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin('PATIENT')}
              className="flex items-center gap-2 border border-border hover:border-foreground bg-muted/30 hover:bg-muted/70 p-2 rounded-lg text-left transition-all cursor-pointer group"
            >
              <UserIcon size={14} className="text-muted-foreground group-hover:text-foreground shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">Patient</div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">Intake Care</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>

    {/* Footer */}
    <footer className="text-center pt-8 text-[11px] text-muted-foreground font-mono">
      Hospital Management Platform • Protected by JWT & Mongoose RBAC
    </footer>
  </div>
);
};
