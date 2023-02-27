import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import App from "@component/App";
import Home from "@page/Home";


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={< App />}>
      <Route path="/" element={<Home />} />
    </Route>
  )
);


export default router;