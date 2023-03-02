import useUser from "@/lib/hooks/useUser";
import { play } from "@/lib/system/commands";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";

const Home = () => {
    const { isLoading, user } = useUser();

    return (
        <div className="h-full">
            <AuthenticatedTemplate>
                <div className="h-full flex flex-col justify-center">
                    {isLoading ? (
                        <div>Loading</div>
                    ) : (
                        <button type="button" onClick={() => play({
                            classpath: "",
                            console: false,
                            game_directory: "C:\\Users\\Collin\\AppData\\Roaming\\.minecraft",
                            classpath_separator: ";",
                            version: "1.19.3",
                            token: user?.minecraft?.token.access_token,
                            uuid: user?.minecraft?.profile.id,
                            xuid: user?.minecraft?.xuid,
                            username: user?.minecraft?.profile.name,
                            use_custom_resolution: false,
                            is_demo: false,
                            enable_logging_config: false,
                            disable_mulitplayer: false,
                            disable_chat: false,
                        })}>Play</button>
                    )}
                </div>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <div>Please login to A Micrsoft account</div>
            </UnauthenticatedTemplate>
        </div>
    );
}

export default Home;