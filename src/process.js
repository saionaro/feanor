/**
 * Callback generator for process exit callbacks.
 * @param {function} resolve Promise resolve callback
 * @param {function} reject Promise reject callback
 * @param {string} command Command invoked
 * @param {string[]} args Command args invoked
 */
function handleProcessExit(resolve, reject, command, args) {
  return (code) => {
    if (code !== 0) {
      return reject({
        command: `${command} ${args.join(" ")}`,
      });
    }
    resolve();
  };
}

module.exports = { handleProcessExit };
