const express = require("express");
const { Gateway, Wallets } = require("fabric-network");
const fs = require("fs");
const FabricCAServices = require("fabric-ca-client");
const path = require("path");
const yaml = require("js-yaml");
const { FileSystemWallet } = Wallets;
const walletPath = path.join(process.cwd(), "wallet");
const app = express();
const port = 8500;

app.use(express.json());
const fabricCaClient = new FabricCAServices("https://172.19.0.8:7054");

app.post("/createLand", async (req, res) => {
  try {
    const { landID, ownerName } = req.body;

    const gateway = new Gateway();
    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const connectionProfile = yaml.safeLoad(
      fs.readFileSync("connection.yaml", "utf8")
    );

    const gatewayOptions = {
      wallet,
      identity: "admin", // Assuming you have a user1 identity in your wallet
      discovery: { enabled: false, asLocalhost: false },
      timeout: 50000,
    };

    await gateway.connect(connectionProfile, gatewayOptions);
    const network = await gateway.getNetwork(connectionProfile.name);
    const contract = network.getContract("LandContract");

    const createLandResponse = await contract.submitTransaction(
      "CreateLand",
      landID,
      ownerName
    );
    res.status(200).send(createLandResponse.toString());
  } catch (error) {
    console.error(`Error executing createLand endpoint: ${error}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/readLand/:landID", async (req, res) => {
  try {
    const { landID } = req.params;

    const gateway = new Gateway();
    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const connectionProfile = yaml.safeLoad(
      fs.readFileSync("connection.yaml", "utf8")
    );

    const gatewayOptions = {
      wallet,
      identity: "admin", // Assuming you have a user1 identity in your wallet
      discovery: { enabled: false, asLocalhost: false },
      timeout: 50000,
    };
    console.log(gatewayOptions);
    try {
      const a_gateway_connect = await gateway.connect(
        connectionProfile,
        gatewayOptions
      );
    } catch (error) {
      console.log(error);
    }
    // console.log("gateway_conect", a_gateway_connect);
    const network = await gateway.getNetwork(connectionProfile.name);
    console.log("network: ", network, "Connection profile:", connectionProfile);
    const contract = network.getContract("LandContract");
    console.log("contract",contract);

    const readLandResponse = await contract.evaluateTransaction(
      "ReadLand",
      landID
    );
    console.log(readLandResponse)
    res.status(200).send(readLandResponse.toString());
  } catch (error) {
    console.error(`Error executing readLand endpoint: ${error}`);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/enrollUser", async (req, res) => {
  try {
    const { enrollmentID, enrollmentSecret, mspId } = req.body;
    console.log(enrollmentID);
    const enrollment = await fabricCaClient.enroll({
      enrollmentID,
      enrollmentSecret,
    });
    console.log(enrollment);

    const identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId,
      type: "X.509",
    };

    const wallet = await Wallets.newFileSystemWallet(walletPath);
    await wallet.put(enrollmentID, identity);

    res
      .status(200)
      .send("User enrolled and identity added to wallet successfully.");
  } catch (error) {
    console.error(`Error enrolling user: ${error}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/listIdentities", async (req, res) => {
  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identities = await wallet.list();

    res.status(200).json(identities);
  } catch (error) {
    console.error(`Error listing identities: ${error}`);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
