#!/bin/sh

###############################################################################
###############################################################################
#########   This should get loaded into ~/.config/husky on `prepare`  #########
#########   to ensure we have the correct environment for running     #########
#########   our git scripts (e.g. pre-commit).                        #########
###############################################################################
###############################################################################

# This loads nvm.sh and sets the correct PATH before running hook
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

PATH="/usr/local/bin:$PATH"

nvm install
nvm use