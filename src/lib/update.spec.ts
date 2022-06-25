import { checkForModsUpdate } from "./update";
import type { Profile } from '../types';
import type { Mod } from "../pages/store/Mods";

describe("Mod updating system",()=>{
   
    describe("CheckForModsUpdate",()=>{
        let profile: Profile;
        let mods: Mod[] = [];
    
        beforeAll(async ()=>{
            const res = await fetch("http://localhost:8000/mods");
            const data = await res.json();
            mods = data;
        });
    
        beforeEach(()=>{
            profile = {
                banner: "",
                card: "",
                category: "",
                created: "",
                icon: "TEMP_ICON",
                isModpack: false,
                lastUsed: "",
                lastVersionId: "fabric-loader-1.11.0-1.18.2",
                mods: [ ],
                name: "TEST",
                type: "custom",
                uuid: "f565f351-2e04-44e7-a5cc-921fc7b8fb84"
            };
        });

        it("Check for updates for mods with no build",async()=>{
            profile.mods.push({
                icon: "https://media.forgecdn.net/avatars/thumbnails/284/773/64/64/637298471098686391.png",
                id: "9aafee3e-57eb-4c81-8331-88aa5a91755f",
                name: "Sodium",
                version: "0.4.0"
            });
            
            const output = await checkForModsUpdate(profile,mods);

            expect(output.update_list).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        url: "https://github.com/CaffeineMC/sodium-fabric/releases/download/mc1.18.2-0.4.1/sodium-fabric-mc1.18.2-0.4.1+build.15.jar",
                        uuid: "9aafee3e-57eb-4c81-8331-88aa5a91755f",
                        name: "Sodium",
                        version: "0.4.1+build.15"
                    })
                ])
            );

            expect(output.profile.mods).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        version: "0.4.1+build.15",
                        name: "Sodium",
                        id: "9aafee3e-57eb-4c81-8331-88aa5a91755f",
                        icon: "https://media.forgecdn.net/avatars/thumbnails/284/773/64/64/637298471098686391.png"
                    })
                ])
            );


        });

        it("Failes when working with invaild version",async()=>{


        });
    });
});


