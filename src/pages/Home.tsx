import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";

const Home = () => {
    return (
        <div className="h-full">
            <AuthenticatedTemplate>
                <div>
                    Content and stuff
                </div>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <div>Please login to A Micrsoft account</div>
            </UnauthenticatedTemplate>
        </div>
    );
}

export default Home;