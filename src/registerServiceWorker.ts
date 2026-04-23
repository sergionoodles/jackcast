const SERVICE_WORKER_URL = "/sw.js";
const UPDATE_INTERVAL_MS = 60 * 1000;

const listenForControllerChange = () => {
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => {
      window.location.reload();
    },
    { once: true },
  );
};

const watchForUpdates = (registration: ServiceWorkerRegistration) => {
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) {
      return;
    }

    worker.addEventListener("statechange", () => {
      if (
        worker.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        listenForControllerChange();
      }
    });
  });
};

const checkForUpdates = (registration: ServiceWorkerRegistration) => {
  registration.update().catch(() => {});
};

export const registerServiceWorker = () => {
  if (
    typeof window === "undefined" ||
    import.meta.env.DEV ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        SERVICE_WORKER_URL,
      );

      watchForUpdates(registration);
      checkForUpdates(registration);

      window.setInterval(() => {
        checkForUpdates(registration);
      }, UPDATE_INTERVAL_MS);

      window.addEventListener("online", () => {
        checkForUpdates(registration);
      });
    } catch (error) {
      console.error("Service worker registration failed.", error);
    }
  });
};
