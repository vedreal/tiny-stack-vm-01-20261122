# tiny-stack-vm-01-20261122

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)

make.fun entry for competition **`tiny-stack-vm-01-run-20261122`**
("Build a tiny stack virtual machine, 22 November 2026", $100 prize pool).

`main.ts` (Node 22, standard library only) is an exact interpreter of the
tiny stack ISA v1: wrapping 32-bit arithmetic, unsigned DIV/MOD/LT, all ten
traps with their own exit codes, and the step and output limits. No network,
no clock, no randomness: two runs write byte-identical output.
