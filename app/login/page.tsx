import { Suspense } from "react";
import LoginForm from "@/components/loginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-5">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <img
              src="/sagrerenc.jpg"
              alt="Hockey"
              className="h-16 w-16 object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            SAGRERENC
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Accede a tu zona privada
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <Suspense
            fallback={
              <div className="py-4 text-center text-sm text-gray-500">
                Cargando...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

      </div>
    </main>
  );
}
