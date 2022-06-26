import { ParseID, StringHash, StringifyID, SatisfiesMinecraftVersion } from './ids';

describe("Ids Methods",()=>{
    describe("StringHash",()=>{
        it("should create the same output with same state regradless of object",()=>{
            let a = StringHash(JSON.stringify({ test_data: "world", int: 123 }));
            let b = StringHash(JSON.stringify({ test_data: "world", int: 123 }));

            expect(a).toBe(b);
        });
        it("should create different outputs",()=>{
            let a = StringHash(JSON.stringify({ test_data: "world", int: 123 }));
            let b = StringHash(JSON.stringify({ test_data: "after world war", int: 3433 }));

            expect(a).not.toBe(b);
        });
    });
    describe("Stringify Id",()=>{
        it("should take parts of a minecraft version and combine them",()=>{
            const id = StringifyID("1.19","forge","40.30.33",[]);

            expect(id).toBe("1.19-forge-40.30.33");
        });
    });
    describe("Parse ID",()=>{

        it("sould parse a string into the three parts",()=>{

            const output = ParseID("fabric-loader-1.11.0-1.19")

            expect(output).toMatchObject({
                minecraft: "1.19",
                loader: "fabric",
                loader_version: "1.11.0"
            })

        });
    });

    describe("SatisfiesMinecraftVersion",()=>{
        it("sould return true for satisfies range",()=>{
            const output = SatisfiesMinecraftVersion("fabric-loader-1.11.0-1.19","1.19");
            expect(output).toBeTruthy();
        }); 
        it("sould return true for a wild card range",()=>{
            const output = SatisfiesMinecraftVersion("fabric-loader-1.11.0-1.19","1.19.*");
            expect(output).toBeTruthy();
        }); 
    });
});