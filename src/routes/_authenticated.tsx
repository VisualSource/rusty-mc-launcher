import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Loader2 } from "lucide-react";
import bg from "../images/Vanilla-PMP_Collection-Carousel-0_Tricky-Trials_1280x768.jpg"
import { TypographyH4 } from "@/components/ui/typography";

export const Route = createFileRoute("/_authenticated")({
	component: () => {
		const location = useLocation();
		const isAuth = useIsAuthenticated();
		const masl = useMsal();

		if (location.pathname.startsWith("/settings")) {
			return (<Outlet />);
		}

		if (masl.inProgress === "startup") {
			return (
				<div className="h-full flex items-center justify-center w-full bg-accent relative">
					<img src={bg} alt="tricky-trials" className="h-full w-full object-fill" />
					<div className="absolute w-full h-full flex items-center justify-center gap-2">
						<div className="bg-accent/90 shadow-lg flex flex-col items-center gap-4 rounded-lg px-8 py-4">
							<span className="animate-spin">
								<Loader2 className="h-8 w-8" />
							</span>
							<TypographyH4>Loading Profile...</TypographyH4>

						</div>
					</div>
				</div>
			);
		}
		if (!isAuth) {
			return (
				<div className="h-full flex items-center justify-center w-full bg-accent relative">
					<img src={bg} alt="tricky-trials" className="h-full w-full object-fill" />
				</div>
			);
		}

		return (<Outlet />);
	},
});
