import React, { useEffect } from "react";
import { Form, Formik } from "formik";
import formHandler from "@/app/common/utils/formHandler";
import authService from "@/app/services/authService";
import InputField from "@/app/components/forminputs/InputField";
import { useSession } from "@/app/common/context/sessionContext";
import { LoggedInUserDto } from "@/app/common/dtos/LoggedInUserDto";
import { NextRouter, useRouter } from "next/router";
import GuestLayout from "@/app/components/layout/GuestLayout";
import ButtonSubmit from "@/app/components/forminputs/ButtonSubmit";
import bannerNotification from "@/app/services/bannerNotificationService";
import { Button } from "react-bootstrap";
import { ExternalLoginType } from "@/app/common/enums/ExternalLoginType";
import authUtils from "@/app/common/utils/authUtils";
import buttonHandler from "@/app/common/utils/buttonHandler";
import bannerNotificationService from "@/app/services/bannerNotificationService";
import { GetServerSidePropsContext } from "next";
import eventService from "@/app/services/eventService";
import cn from "classnames";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {
      appBaseUrl: process.env.APP_BASE_URL,
    },
  };
}

interface serverSideProps {
  appBaseUrl: string;
  apiBase: string;
}

const Login = (props: serverSideProps) => {
  const { setUser } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.failure_message) {
      bannerNotificationService.error(router.query.failure_message);
    }
    if(router.query.gclid){
      eventService.trackConversion(router.query.gclid);

    }

  }, [router.isReady]);
  return (
    <GuestLayout>
      <div className="p-4">
        <Formik
          initialValues={{
            email: "",
            password: "",
          }}
          onSubmit={formHandler(
            false,
            {
              id: "login_form",
              pickFieldsForEvent: ["email"],
            },
            authService.login,
            () => handleLogin(setUser, router)
          )}
        >
          <Form>
            <InputField
              type="email"
              name="email"
              title="Email"
              placeholder="Enter email"
            />
            <InputField
              type="password"
              name="password"
              title="Password"
              placeholder="Enter password"
            />
            <ButtonSubmit className="form-control btn-lg" />
          </Form>
        </Formik>
        <div className="mt-3 d-flex flex-row align-items-center">
          <p className="horizontal-line">
            <span> or </span>{" "}
          </p>
        </div>
        <div className="mt-3 gap-2 text-center">
          <Button
            className="d-block btn-lg"
            href={authUtils.getExternalLoginUrl(
              props.appBaseUrl,
              ExternalLoginType.GOOGLE,
              router.pathname
            )}
            onClick={buttonHandler(false, { id: "login_with_google" })}
            variant="outline-dark"
          >
            <img src="/images/google.png" width={14} className="rounded-circle" />
            <span className="mx-2">Login with Google</span>
          </Button>
        </div>
      </div>
    </GuestLayout>
  );
};
const handleLogin = async (
  setUser: (session: LoggedInUserDto | null) => void,
  router: NextRouter
) => {
  if (process.browser) {
    const res = await authService.whoAmI();
    setUser(res.data);
    await router.push("/");
  }
};
export default Login;
