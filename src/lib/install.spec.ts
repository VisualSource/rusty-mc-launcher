import { Mod } from '../pages/store/Mods';
import { Profile } from '../types';
import { AddModToProfile } from './install';

describe("AddModToProfile",()=>{
    let mods: Mod[] = [];
    let profile: Profile = {
        banner: "",
        card: "",
        category: "",
        created: "",
        icon: "TEMP_ICON",
        isModpack: false,
        lastUsed: "",
        lastVersionId: "fabric-loader-1.11.0-1.18.2",
        mods: [],
        name: "TEST",
        type: "custom",
        uuid: "f565f351-2e04-44e7-a5cc-921fc7b8fb84"
    };

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
            mods: [],
            name: "TEST",
            type: "custom",
            uuid: "f565f351-2e04-44e7-a5cc-921fc7b8fb84"
        };
    });
       
    it("should fail due to inconpatable mod",async ()=>{
        const uuid = "9aafee3e-57eb-4c81-8331-88aa5a91755f";        
        let mod = mods.find(value=>value.uuid === uuid);
        if (!mod) throw new Error(`Cant not run test do to missing mod with uuid(${uuid})`);

        profile.mods.push({
            name: "OptiFabric",
            id: "ea98224a-67b9-4e4c-a3e3-fb29a38fbf78",
            version: "1.13.0",
            icon: ""
        });

        try {
            AddModToProfile(mod,profile,mods);
        } catch (error: any) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe(`Mod Sodium is Inconpatable with OptiFabric`);
        }
    });

    it("should fail due to missing inconpatable mod",async ()=>{
        const uuid = "9aafee3e-57eb-4c81-8331-88aa5a91755f";        
        let mod = mods.find(value=>value.uuid === uuid);
        if (!mod) throw new Error(`Cant not run test do to missing mod with uuid(${uuid})`);

        profile.mods.push({
            name: "OptiFabric",
            id: "ea98224a",
            version: "1.13.0",
            icon: ""
        });

        try {
            AddModToProfile(mod,profile,mods);
        } catch (error: any) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe(`Can't install Sodium do to missing inconpatable mod uuid.`);
        }
    });

    it("should add mod to profile",()=>{
        const uuid = "9aafee3e-57eb-4c81-8331-88aa5a91755f";        
        let mod = mods.find(value=>value.uuid === uuid);
        if (!mod) throw new Error(`Cant not run test do to missing mod with uuid(${uuid})`);


        const output = AddModToProfile(mod,profile,mods);


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
        
        expect(output.download).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: "Sodium", 
                    id: "9aafee3e-57eb-4c81-8331-88aa5a91755f", 
                    download: {
                        url: "https://github.com/CaffeineMC/sodium-fabric/releases/download/mc1.18.2-0.4.1/sodium-fabric-mc1.18.2-0.4.1+build.15.jar",
                        version: "0.4.1+build.15"
                    }
                })
            ])
        );
       

    });


    it("should add depdent mods",()=>{
        const uuid = "ea98224a-67b9-4e4c-a3e3-fb29a38fbf78";        
        let mod = mods.find(value=>value.uuid === uuid);
        if (!mod) throw new Error(`Cant not run test do to missing mod with uuid(${uuid})`);

        const output = AddModToProfile(mod,profile,mods);

        expect(output.profile.mods).toEqual( 
            expect.arrayContaining([
                expect.objectContaining({
                    version: "HD_U_H7",
                    name: "OptiFine",
                    id: "42d8622a-fdf4-4f8c-ba6e-106ccf762e63",
                    icon: "https://www.optifine.net/images/of16r.png"
                })
            ])
        );

        expect(output.download).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: "OptiFine", 
                    id: "42d8622a-fdf4-4f8c-ba6e-106ccf762e63", 
                    download: {
                        url: "https://optifine.net/downloadx?f=OptiFine_1.18.2_HD_U_H7.jar&x=7b1ab8c724a72121db100463d726b921",
                        version: "HD_U_H7"
                    }
                })
            ])
        );

    });

});
