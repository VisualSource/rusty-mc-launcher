import { StringHash, StringifyID } from './ids';

test("StringHash generation", ()=>{

    let a = StringHash(JSON.stringify({ test_data: "world", int: 123 }));
    let b = StringHash(JSON.stringify({ test_data: "world", int: 123 }));
    let c = StringHash(JSON.stringify({ test_data: "after", int: 343 }));

    
    expect(a).toBe(b);
    expect(a).not.toBe(c);
});

test("Minecraft version id stringify",()=>{
    const id = StringifyID("1.19","forge","40.30.33",[]);

    expect(id).toBe("1.19-forge-40.30.33");
});