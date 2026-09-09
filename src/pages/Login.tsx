import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthForm, type AuthFormField } from "@/features/auth/components/auth-form";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/shared/i18n/i18n";

const Login = () => {
  const { t } = useI18n();
  const { login, signedIn } = useAuth();
  const navigate = useNavigate();

  // Nothing to sign into twice.
  useEffect(() => {
    if (signedIn) navigate("/", { replace: true });
  }, [navigate, signedIn]);

  const fields: AuthFormField[] = [
    {
      name: "email",
      label: t.auth.email,
      placeholder: t.auth.emailPlaceholder,
      type: "email",
      autoComplete: "email",
    },
    {
      name: "password",
      label: t.auth.password,
      placeholder: t.auth.passwordPlaceholder,
      type: "password",
      autoComplete: "current-password",
    },
  ];

  return (
    <AuthForm
      title={t.auth.loginTitle}
      subtitle={t.auth.loginSubtitle}
      fields={fields}
      submitLabel={t.auth.submitSignIn}
      onSubmit={async (values) => {
        await login({ email: values.email, password: values.password });
        navigate("/", { replace: true });
      }}
      footer={
        <span>
          {t.auth.noAccount}{" "}
          <Link to="/register" className="font-medium text-ink underline-offset-4 hover:underline">
            {t.auth.signUp}
          </Link>
        </span>
      }
    />
  );
};

export default Login;
