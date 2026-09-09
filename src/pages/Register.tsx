import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthForm, type AuthFormField } from "@/features/auth/components/auth-form";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/shared/i18n/i18n";

const Register = () => {
  const { t } = useI18n();
  const { register, signedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (signedIn) navigate("/", { replace: true });
  }, [navigate, signedIn]);

  const fields: AuthFormField[] = [
    {
      name: "name",
      label: t.auth.name,
      placeholder: t.auth.namePlaceholder,
      type: "text",
      autoComplete: "name",
    },
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
      autoComplete: "new-password",
      hint: t.auth.passwordHint,
    },
  ];

  return (
    <AuthForm
      title={t.auth.registerTitle}
      subtitle={t.auth.registerSubtitle}
      fields={fields}
      submitLabel={t.auth.submitSignUp}
      onSubmit={async (values) => {
        await register({ name: values.name, email: values.email, password: values.password });
        navigate("/", { replace: true });
      }}
      footer={
        <span>
          {t.auth.haveAccount}{" "}
          <Link to="/login" className="font-medium text-ink underline-offset-4 hover:underline">
            {t.auth.signIn}
          </Link>
        </span>
      }
    />
  );
};

export default Register;
