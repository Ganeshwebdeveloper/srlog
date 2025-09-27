import LoginForm from '../LoginForm';

export default function LoginFormExample() {
  const handleLogin = (email: string, password: string, role: "admin" | "driver") => {
    console.log(`Login: ${email} as ${role}`);
  };

  return <LoginForm onLogin={handleLogin} />;
}