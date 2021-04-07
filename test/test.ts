import { BeforeAll, expect, Test, TestCase, TestSuite } from 'testyts';
import Rbd from "../src/rbd";



@TestSuite()
export class RbdTestSuite {
    @Test()
    @TestCase(
        'Should be already mapped',
        'monitoring_prometheus-data',
        '/dev/rbd0'
    )
    @TestCase(
        'Should not be already mapped',
        'monitoring_prometheus-data2',
        '/dev/rbd1'
    )
    async testRbdMap(name: string, result: string){
        const rbd = new Rbd({ pool: "replicapool" });
        expect.toBeEqual(await rbd.map(name), result);
    }
}