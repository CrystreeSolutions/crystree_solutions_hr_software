
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

function ProtectedRoute({ children }) {
  const [authenticationStatus, setAuthenticationStatus] =
    useState("checking");

  useEffect(() => {
    let isComponentMounted = true;

    const verifyAuthentication = async () => {
      const authenticationToken =
        localStorage.getItem("hrmToken") ||
        sessionStorage.getItem("hrmToken");

      if (!authenticationToken) {
        if (isComponentMounted) {
          setAuthenticationStatus("unauthenticated");
        }
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/verify-authentication",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authenticationToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const responseData = await response.json();

        if (
          response.ok &&
          responseData.success &&
          String(responseData.user?.role)
            .trim()
            .toLowerCase() === "super admin"
        ) {
          localStorage.setItem(
            "hrmUser",
            JSON.stringify(responseData.user)
          );

          sessionStorage.setItem(
            "hrmUser",
            JSON.stringify(responseData.user)
          );

          if (isComponentMounted) {
            setAuthenticationStatus("authenticated");
          }
        } else {
          localStorage.removeItem("hrmToken");
          localStorage.removeItem("hrmUser");
          sessionStorage.removeItem("hrmToken");
          sessionStorage.removeItem("hrmUser");

          if (isComponentMounted) {
            setAuthenticationStatus("unauthenticated");
          }
        }
      } catch (error) {
        console.error(
          "Authentication verification failed:",
          error
        );

        if (isComponentMounted) {
          setAuthenticationStatus("error");
        }
      }
    };

    verifyAuthentication();

    return () => {
      isComponentMounted = false;
    };
  }, []);

  if (authenticationStatus === "checking") {
    return <div className="authentication-loading">
      Verifying administrator authentication...
    </div>;
  }

  if (
    authenticationStatus === "unauthenticated" ||
    authenticationStatus === "error"
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
