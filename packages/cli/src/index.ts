import { Command } from 'commander';
import { compileCommand } from './commands/compile.js';
import { applyCommand } from './commands/apply.js';
import { doctorCommand } from './commands/doctor.js';
import { runHookCommand } from './commands/run-hook.js';

const PKG_VERSION = '0.1.0-alpha.0';
const SETTINGS_ROOT_DEFAULT = new URL('../../settings', import.meta.url).pathname;
const detectOs = (): 'macos' | 'linux' | 'windows' =>
  process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : 'linux';

export async function main(argv: string[]): Promise<void> {
  const program = new Command();
  program.name('ccsec').description('Claude Code Security CLI').version(PKG_VERSION);

  program.command('compile')
    .requiredOption('--profile <name>')
    .requiredOption('--out <path>')
    .option('--target <kind>', 'managed | user', 'user')
    .option('--os <os>', 'macos | linux | windows', detectOs())
    .option('--settings-root <path>', 'path to packages/settings', SETTINGS_ROOT_DEFAULT)
    .action(async (opts) => {
      await compileCommand({ settingsRoot: opts.settingsRoot, profile: opts.profile, out: opts.out, target: opts.target, os: opts.os });
      console.log(`compiled ${opts.profile} -> ${opts.out}`);
    });

  program.command('apply')
    .requiredOption('--profile <name>')
    .option('--claude-dir <path>', 'path to .claude dir', `${process.env.HOME}/.claude`)
    .option('--os <os>', 'macos | linux | windows', detectOs())
    .option('--settings-root <path>', 'path to packages/settings', SETTINGS_ROOT_DEFAULT)
    .option('--dry-run', '', false)
    .option('--force', 'override clobber guard', false)
    .option('--rules', 'install CLAUDE.md template', false)
    .option('--no-rules', 'skip CLAUDE.md template')
    .action(async (opts) => {
      const installRules = opts.rules === true;
      const r = await applyCommand({
        settingsRoot: opts.settingsRoot,
        profile: opts.profile,
        claudeDir: opts.claudeDir,
        os: opts.os,
        dryRun: !!opts.dryRun,
        force: !!opts.force,
        installRules,
      });
      if (r.wrote) {
        console.log(`applied ${opts.profile} -> ${opts.claudeDir}/settings.json`);
        if (r.rulesInstalled) console.log(`installed CLAUDE.md template -> ${opts.claudeDir}/CLAUDE.md`);
      } else {
        console.log('dry-run, nothing written');
      }
    });

  program.command('doctor')
    .option('--claude-dir <path>', 'path to .claude dir', `${process.env.HOME}/.claude`)
    .action(async (opts) => {
      const r = await doctorCommand({ claudeDir: opts.claudeDir });
      if (r.ok) { console.log('OK'); return; }
      for (const f of r.findings) console.error(`[${f.code}] ${f.message}`);
      process.exit(1);
    });

  program.command('run-hook')
    .description('Run a single hook (reads context JSON from stdin; used by Claude Code hooks)')
    .requiredOption('--name <name>', 'hook name (e.g. secret-guard)')
    .requiredOption('--profile <profile>', 'active profile (baseline | strict | regulated)')
    .action(async (opts) => {
      await runHookCommand({ name: opts.name, profile: opts.profile });
    });

  await program.parseAsync(argv);
}
