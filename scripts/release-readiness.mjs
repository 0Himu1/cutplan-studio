import {launchReadiness} from '../src/lib/launch/readiness.ts';
const report=launchReadiness();console.log(JSON.stringify(report,null,2));process.exitCode=report.releaseAllowed?0:2;
