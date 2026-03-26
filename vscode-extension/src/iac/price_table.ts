// static monthly cost estimates for common aws resource types.
// region: us-east-1, on-demand pricing, as of 2025.
// source: https://aws.amazon.com/pricing/
// these are baseline approximations — actual costs vary by region, reserved vs on-demand, data transfer, etc.

// ec2 on-demand: hourly_rate * 730 hours
export const EC2_COSTS: Record<string, number> = {
    't2.nano':      2.85,
    't2.micro':     8.47,
    't2.small':     16.94,
    't2.medium':    33.87,
    't2.large':     67.74,
    't3.nano':      3.80,
    't3.micro':     7.59,
    't3.small':     15.18,
    't3.medium':    30.37,
    't3.large':     60.74,
    't3.xlarge':    121.47,
    't3.2xlarge':   242.94,
    't3a.nano':     3.41,
    't3a.micro':    6.82,
    't3a.small':    13.65,
    't3a.medium':   27.30,
    't3a.large':    54.61,
    't3a.xlarge':   109.22,
    't3a.2xlarge':  218.44,
    'm5.large':     70.08,
    'm5.xlarge':    140.16,
    'm5.2xlarge':   280.32,
    'm5.4xlarge':   560.64,
    'm6i.large':    69.35,
    'm6i.xlarge':   138.70,
    'm6i.2xlarge':  277.40,
    'm6a.large':    62.78,
    'm6a.xlarge':   125.56,
    'c5.large':     62.05,
    'c5.xlarge':    124.10,
    'c5.2xlarge':   248.20,
    'c6i.large':    61.32,
    'c6i.xlarge':   122.64,
    'c6i.2xlarge':  245.28,
    'r5.large':     91.98,
    'r5.xlarge':    183.96,
    'r5.2xlarge':   367.92,
    'r6i.large':    91.25,
    'r6i.xlarge':   182.50,
    'r6i.2xlarge':  365.00,
};

// rds on-demand: single-az, general purpose storage not included
export const RDS_COSTS: Record<string, number> = {
    'db.t3.micro':    12.41,
    'db.t3.small':    24.82,
    'db.t3.medium':   49.64,
    'db.t3.large':    99.28,
    'db.t3.xlarge':   198.55,
    'db.t3.2xlarge':  397.10,
    'db.t4g.micro':   10.22,
    'db.t4g.small':   20.44,
    'db.t4g.medium':  40.88,
    'db.t4g.large':   81.76,
    'db.r5.large':    175.20,
    'db.r5.xlarge':   350.40,
    'db.r5.2xlarge':  700.80,
    'db.r6g.large':   154.76,
    'db.r6g.xlarge':  309.52,
    'db.m5.large':    131.40,
    'db.m5.xlarge':   262.80,
    'db.m6g.large':   116.80,
    'db.m6g.xlarge':  233.60,
};

// elasticache on-demand: single node
export const ELASTICACHE_COSTS: Record<string, number> = {
    'cache.t3.micro':   12.41,
    'cache.t3.small':   24.82,
    'cache.t3.medium':  49.64,
    'cache.t4g.micro':  10.22,
    'cache.t4g.small':  20.44,
    'cache.t4g.medium': 40.88,
    'cache.r6g.large':  116.80,
    'cache.r6g.xlarge': 233.60,
    'cache.m6g.large':  116.07,
    'cache.m6g.xlarge': 232.14,
};

// nat gateway: $0.045/hr base + $0.045/GB processed (base only shown)
export const NAT_GATEWAY_BASE_MONTHLY = 32.85;

// fargate: $0.04048/vCPU/hr + $0.004445/GB/hr
export function fargateMonthly(vcpu: number, memoryGb: number): number {
    return (0.04048 * vcpu + 0.004445 * memoryGb) * 730;
}

// cdk InstanceClass enum → instance family string
export const CDK_CLASS_MAP: Record<string, string> = {
    T2: 't2', T3: 't3', T3A: 't3a', T4G: 't4g',
    M4: 'm4', M5: 'm5', M5A: 'm5a', M5N: 'm5n', M6I: 'm6i', M6A: 'm6a', M6G: 'm6g',
    C4: 'c4', C5: 'c5', C5A: 'c5a', C6I: 'c6i', C6A: 'c6a', C6G: 'c6g',
    R4: 'r4', R5: 'r5', R5A: 'r5a', R5N: 'r5n', R6I: 'r6i', R6G: 'r6g',
    X1: 'x1', X1E: 'x1e', Z1D: 'z1d',
    // deprecated aliases
    BURSTABLE2: 't2', BURSTABLE3: 't3', BURSTABLE3_AMD: 't3a',
    STANDARD4: 'm4', STANDARD5: 'm5', STANDARD6_AMD: 'm6a',
    COMPUTE4: 'c4', COMPUTE5: 'c5', COMPUTE6_AMD: 'c6a',
    MEMORY4: 'r4', MEMORY5: 'r5', MEMORY6_INTEL: 'r6i',
};

// cdk InstanceSize enum → size string
export const CDK_SIZE_MAP: Record<string, string> = {
    NANO: 'nano', MICRO: 'micro', SMALL: 'small', MEDIUM: 'medium', LARGE: 'large',
    XLARGE: 'xlarge', XLARGE2: '2xlarge', XLARGE4: '4xlarge',
    XLARGE8: '8xlarge', XLARGE16: '16xlarge', XLARGE24: '24xlarge', XLARGE32: '32xlarge',
};

// dynamodb provisioned capacity (per unit per month = per unit/hour * 730h, us-east-1)
export const DYNAMODB_WCU_MONTHLY = 0.00065 * 730; // ~$0.47/WCU/month
export const DYNAMODB_RCU_MONTHLY = 0.00013 * 730; // ~$0.09/RCU/month

// kubernetes rough compute cost (average across instance types, us-east-1 on-demand)
export const K8S_VCPU_MONTHLY  = 35;  // ~$35/vCPU/month
export const K8S_GB_MEM_MONTHLY = 4.4; // ~$4.40/GB memory/month

// gcp compute engine on-demand monthly cost (us-central1, hourly * 730h)
export const GCP_COMPUTE_COSTS: Record<string, number> = {
    'e2-micro':       6.11,
    'e2-small':      12.23,
    'e2-medium':     24.46,
    'e2-standard-2': 48.93,
    'e2-standard-4': 97.86,
    'e2-standard-8': 195.79,
    'e2-standard-16':391.58,
    'e2-highcpu-2':  35.77,
    'e2-highcpu-4':  71.54,
    'e2-highcpu-8':  143.07,
    'e2-highmem-2':  67.28,
    'e2-highmem-4':  134.56,
    'n1-standard-1': 34.67,
    'n1-standard-2': 69.35,
    'n1-standard-4': 138.70,
    'n1-standard-8': 277.40,
    'n1-highcpu-2':  42.77,
    'n1-highcpu-4':  85.54,
    'n1-highmem-2':  90.32,
    'n1-highmem-4':  180.64,
    'n2-standard-2': 70.88,
    'n2-standard-4': 141.76,
    'n2-standard-8': 283.60,
    'n2-highcpu-2':  52.11,
    'n2-highcpu-4':  104.22,
    'n2-highmem-2':  97.61,
    'n2-highmem-4':  195.22,
    'c2-standard-4': 152.42,
    'c2-standard-8': 304.78,
    'c3-standard-4': 146.58,
    'c3-standard-8': 293.15,
};

// gcp cloud sql on-demand monthly cost (us-central1, single instance, no HA)
export const GCP_SQL_COSTS: Record<string, number> = {
    'db-f1-micro':      10.95,
    'db-g1-small':      36.50,
    'db-n1-standard-1': 76.65,
    'db-n1-standard-2': 153.30,
    'db-n1-standard-4': 306.60,
    'db-n1-standard-8': 613.20,
    'db-n1-highmem-2':  189.07,
    'db-n1-highmem-4':  378.14,
    'db-n1-highmem-8':  756.28,
    'db-n2-standard-2': 155.33,
    'db-n2-standard-4': 310.66,
    'db-n2-highmem-2':  196.06,
    'db-n2-highmem-4':  392.12,
};

// gke cluster management fee: $0.10/hr per cluster (waived for autopilot on first cluster)
export const GKE_CLUSTER_MONTHLY = 0.10 * 730; // $73/mo
