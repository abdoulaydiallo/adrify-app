"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AuthService } from "@/services/auth.service";
import { ServiceError, ERROR_CODES } from "@/services/errors.service";
import { ModernInput } from "@/components/modern-input";
import { Loader2, LogIn, AlertCircle } from "lucide-react";

const LoginSchema = z.object({
  email: z.email("Format email invalide"),
  password: z
    .string()
    .min(1, "Mot de passe requis")
    .min(6, "Au moins 6 caractères requis"),
});

type FormValues = z.infer<typeof LoginSchema>;

const formVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

const useFormProgress = (form: ReturnType<typeof useForm<FormValues>>) => {
  return useMemo(() => {
    const values = form.getValues();
    const requiredFields: (keyof FormValues)[] = ["email", "password"];

    const filledRequired = requiredFields.reduce(
      (acc, field) => (values[field] && values[field] !== "" ? acc + 1 : acc),
      0
    );

    const totalProgress = (filledRequired / requiredFields.length) * 100;

    return {
      progress: Math.round(totalProgress),
      requiredComplete: filledRequired === requiredFields.length,
      completedFields: filledRequired,
      totalFields: requiredFields.length,
    };
  }, [form.watch()]);
};

export function SignInForm() {
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const formProgress = useFormProgress(form);

  const onSubmit = async (data: FormValues) => {
    setIsPending(true);
    try {
      console.log("Tentative de connexion avec :", data);
      const response = await AuthService.login(data.email, data.password);
      console.log("Connexion réussie, réponse :", response);
      toast.success(
        <div className="flex items-center gap-2">
          <LogIn className="h-4 w-4 text-green-600" />
          <span>Connexion réussie !</span>
        </div>,
        { duration: 2000 }
      );
      console.log("Redirection vers /addresses");
      router.push("/addresses");
    } catch (error) {
      console.error("Erreur de connexion :", error);
      if (ServiceError.isServiceError(error)) {
        const message =
          error.code === ERROR_CODES.SERVICE_UNAVAILABLE
            ? "Le serveur API est inaccessible. Vérifiez que le serveur Laravel est en cours d'exécution sur http://127.0.0.1:8000."
            : error.message;
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div>
              <p className="font-medium">Erreur de connexion</p>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
        );
      } else {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div>
              <p className="font-medium">Erreur inattendue</p>
              <p className="text-sm text-muted-foreground">
                Une erreur est survenue : {String(error)}
              </p>
            </div>
          </div>
        );
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <motion.form
      onSubmit={form.handleSubmit(onSubmit)}
      className="max-w-md w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20 space-y-8"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={formVariants}
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"
        >
          <LogIn className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Se connecter
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Accédez à votre compte
        </p>
      </div>

      <ModernInput<FormValues>
        label="Email"
        name="email"
        control={form.control}
        type="email"
        placeholder="votre@email.com"
        required
        errors={form.formState.errors}
        rules={{
          required: "Email requis",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Format email invalide",
          },
        }}
      />

      <ModernInput<FormValues>
        label="Mot de passe"
        name="password"
        control={form.control}
        placeholder="Votre mot de passe"
        required
        errors={form.formState.errors}
        type={showPassword ? "text" : "password"}
        showPasswordToggle
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
        rules={{
          required: "Mot de passe requis",
          minLength: { value: 6, message: "Au moins 6 caractères requis" },
        }}
      />

      <div className="text-right text-sm text-gray-600 dark:text-gray-400 mb-2">
        {formProgress.progress}% complété ({formProgress.completedFields}/
        {formProgress.totalFields} champs)
      </div>

      <motion.button
        type="submit"
        disabled={!formProgress.requiredComplete || isPending}
        whileHover={{
          scale: formProgress.requiredComplete && !isPending ? 1.02 : 1,
        }}
        whileTap={{
          scale: formProgress.requiredComplete && !isPending ? 0.98 : 1,
        }}
        className={`
          w-full h-14 rounded-xl font-semibold text-white relative overflow-hidden
          transition-all duration-300 flex items-center justify-center gap-2
          ${
            formProgress.requiredComplete && !isPending
              ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/25"
              : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
          }
        `}
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connexion...</span>
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            <span>Se connecter</span>
          </>
        )}
      </motion.button>

      <p className="text-center pt-4 text-gray-600 dark:text-gray-400">
        Pas de compte ?{" "}
        <button
          type="button"
          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          onClick={() => router.push("/auth/register")}
        >
          S'inscrire
        </button>
      </p>
    </motion.form>
  );
}
