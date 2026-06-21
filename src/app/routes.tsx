import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { Profile } from "./components/Profile";
import { TryOn } from "./components/TryOn";
import { History } from "./components/History";
import { NotFound } from "./components/NotFound";
import { Privacy } from "./components/Privacy";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "profile", Component: Profile },
      { path: "tryon", Component: TryOn },
      { path: "history", Component: History },
      { path: "privacy", Component: Privacy },
      { path: "*", Component: NotFound },
    ],
  },
], { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" });
