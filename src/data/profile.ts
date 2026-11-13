export const profile = {
  handle: 'guisosi',
  host: 'void',
  tagline: '// still learning. never done.',
  whoami: 'Eternal Student',
  goal: ['Red Team Operator', 'simulating adversaries in authorized environments, end to end'],
  github: 'https://github.com/guisosi',
};

export type StageStatus = 'done' | 'wip' | 'next' | 'goal';

// update status as you progress; cert is the reference, not a claim
export const roadmap: { name: string; focus: string[]; cert?: string; status: StageStatus }[] = [
  { name: 'Foundations', focus: ['TCP/IP & DNS', 'Linux & Windows', 'Python · PowerShell · Bash'], status: 'done' },
  { name: 'Pentest fundamentals', focus: ['Enumeration', 'Web', 'Privilege escalation'], cert: 'OSCP', status: 'wip' },
  { name: 'Active Directory', focus: ['Kerberos', 'ACL abuse', 'Lateral movement'], cert: 'CRTP', status: 'wip' },
  { name: 'C2 & tradecraft', focus: ['C2 infra', 'OPSEC', 'Beacons'], cert: 'CRTO', status: 'next' },
  { name: 'Evasion & maldev', focus: ['EDR evasion', 'Exploit dev', 'Malware analysis'], cert: 'OSEP', status: 'wip' },
  { name: 'Adversary emulation', focus: ['ATT&CK planning', 'Purple team', 'Reporting'], cert: 'Red Team Operator', status: 'goal' },
];

export const projects = [
  {
    name: 'mavi-chivas',
    desc: 'Analysis of an infostealer disguised as a Minecraft mod.',
    url: 'https://github.com/guisosi/mavi-chivas',
    tags: ['malware', 'reversing'],
  },
  {
    name: 'Tamoai-Infra',
    desc: 'Self-hosted infra with Caddy, CrowdSec, Prometheus, Grafana, Loki and Uptime Kuma. Observability as code.',
    url: 'https://github.com/guisosi/Tamoai-Infra',
    tags: ['infra', 'blue team'],
  },
];
