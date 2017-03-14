#!/bin/bash
set -e -v -x -o pipefail

# ensure the env file exists and fill it out
touch .env.js
echo "export const GOOGLE_CALENDAR_API_KEY = '$GCAL_KEY'" >> .env.js

# disable npm wrapper for npm scripts
echo "loglevel=silent" >> .npmrc

# ensure the log directory exists for danger
mkdir -p logs/

# arguments: [message, ...paths-to-add]
function commit-on-travis {
  # shellcheck disable=SC2086
  git add "${@:2}" # gets arguments 2 and after, leaving out argument 1
  git checkout "$BRANCH"
  git commit -m "$1 [skip ci]"
  # FETCH_HEAD is not a variable
  git checkout "FETCH_HEAD"
  touch .needs-push
}


if [[ $JS ]]; then
  # Ensure prettiness
  npm run prettier
  if ! git diff --quiet ./*.js source/; then
    commit-on-travis "prettify" ./*.js source/
  fi

  # Lint
  npm run lint | tee logs/eslint

  # Validate data
  npm run validate-data -- --quiet | tee logs/validate-data

  # Ensure that the data files have been updated
  npm run bundle-data
  if ! git diff --quiet docs/; then
    commit-on-travis "update docs" docs/
  fi

  # Type check
  npm run flow -- check --quiet | tee logs/flow

  # Build the bundles
  npm run bundle:ios | tee logs/bundle-ios
  npm run bundle:android | tee logs/bundle-android

  # Run tests + collect coverage info
  npm run test -- --coverage 2>&1 | tee logs/jest

  # Danger?
  npm run danger
fi


if [[ $IOS ]]; then
  bundle exec fastlane ios ci_run
fi


if [[ $ANDROID ]]; then
  bundle exec fastlane android ci_run
fi