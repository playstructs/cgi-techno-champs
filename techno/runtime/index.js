// The Techno Champs overlay's runtime, loaded ahead of structs-webapp's entry.
//
// __techno.guild is the guild this page plays through, Techno Champs (guild.js),
// __techno.recovery moves a recovered player of another guild into it
// (recovery.js), __techno.pfp shows players' own pictures (pfp.js), and
// __techno.account creates the account at sign-up without showing its recovery
// key, and offers Download Player in place of Log Out (account.js).
// techno/patches.cjs points webapp's code at them.
import {guild} from './guild.js';
import {recovery} from './recovery.js';
import * as pfp from './pfp.js';
import {account} from './account.js';

globalThis.__techno = Object.freeze({guild, recovery, pfp: Object.freeze({...pfp}), account});
