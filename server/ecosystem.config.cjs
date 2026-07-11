module.exports = {
  apps: [{
    name: "faraz-api",
    script: "src/server.ts",
    interpreter: "tsx",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3001,
    },
  }],
};
