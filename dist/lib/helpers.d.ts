export declare function normaliseFingerprint(obj: any): {};
export declare function diffSizes(baseBranch: any, pullRequestBranch: any): {};
export declare function getPullRequest(context: any, octokit: any): Promise<any>;
export declare function getAssetSizes({ cwd, build }: {
    cwd: any;
    build?: boolean | undefined;
}): Promise<undefined>;
export declare function buildOutputText(output: any): string;
