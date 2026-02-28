const LandRegistry = artifacts.require("LandRegistry");

contract("LandRegistry", accounts => {
  let landRegistry;
  const owner = accounts[0];
  const buyer = accounts[1];
  const admin = accounts[0]; // In tests, first account acts as deployer

  beforeEach(async () => {
    landRegistry = await LandRegistry.new();
  });

  describe("Land Registration", () => {
    it("should register a new land parcel", async () => {
      await landRegistry.registerLand("PLT-001", "Andheri", "Mumbai", "Mumbai", "Maharashtra", 500, { from: owner });
      const land = await landRegistry.lands(1);
      assert.equal(land.plotNumber, "PLT-001");
      assert.equal(land.area, "Andheri");
      assert.equal(land.district, "Mumbai");
      assert.equal(land.city, "Mumbai");
      assert.equal(land.state, "Maharashtra");
      assert.equal(land.areaSqYd.toString(), "500");
      assert.equal(land.owner, owner);
    });

    it("should increment land count", async () => {
      await landRegistry.registerLand("PLT-001", "Andheri", "Mumbai", "Mumbai", "Maharashtra", 500, { from: owner });
      const count = await landRegistry.landCount();
      assert.equal(count.toString(), "1");
    });

    it("should prevent duplicate registration", async () => {
      await landRegistry.registerLand("PLT-001", "Andheri", "Mumbai", "Mumbai", "Maharashtra", 500, { from: owner });
      try {
        await landRegistry.registerLand("PLT-001", "Andheri", "Mumbai", "Mumbai", "Maharashtra", 300, { from: buyer });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert(error.message.includes("already registered"));
      }
    });

    it("should reject empty plot number", async () => {
      try {
        await landRegistry.registerLand("", "Andheri", "Mumbai", "Mumbai", "Maharashtra", 500, { from: owner });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert(error.message.includes("Plot number cannot be empty"));
      }
    });
  });

  describe("Land Transfer", () => {
    beforeEach(async () => {
      await landRegistry.registerLand("PLT-001", "Andheri", "Mumbai", "Mumbai", "Maharashtra", 500, { from: owner });
    });

    it("should put land for sale", async () => {
      await landRegistry.putLandForSale(1, { from: owner });
      const land = await landRegistry.lands(1);
      assert.equal(land.isForSale, true);
    });

    it("should allow transfer request", async () => {
      await landRegistry.putLandForSale(1, { from: owner });
      await landRegistry.requestTransfer(1, { from: buyer });
      const land = await landRegistry.lands(1);
      assert.equal(land.transferRequest, buyer);
    });

    it("should approve transfer", async () => {
      await landRegistry.putLandForSale(1, { from: owner });
      await landRegistry.requestTransfer(1, { from: buyer });
      await landRegistry.approveTransfer(1, { from: owner });
      const land = await landRegistry.lands(1);
      assert.equal(land.owner, buyer);
      assert.equal(land.isForSale, false);
    });

    it("should deny transfer", async () => {
      await landRegistry.putLandForSale(1, { from: owner });
      await landRegistry.requestTransfer(1, { from: buyer });
      await landRegistry.denyTransfer(1, { from: owner });
      const land = await landRegistry.lands(1);
      assert.equal(land.transferRequest, "0x0000000000000000000000000000000000000000");
      assert.equal(land.owner, owner);
    });
  });

  describe("View Functions", () => {
    beforeEach(async () => {
      await landRegistry.registerLand("PLT-001", "Andheri", "Mumbai", "Mumbai", "Maharashtra", 500, { from: owner });
    });

    it("should verify land details", async () => {
      const result = await landRegistry.verifyLand(1);
      assert.equal(result.plotNumber, "PLT-001");
      assert.equal(result.owner, owner);
    });

    it("should return lands by owner", async () => {
      const lands = await landRegistry.getLandsByOwner(owner);
      assert.equal(lands.length, 1);
      assert.equal(lands[0].toString(), "1");
    });

    it("should track ownership history via getPropertyHistory", async () => {
      const history = await landRegistry.getPropertyHistory(1);
      assert.equal(history.length, 1);
      assert.equal(history[0].owner, owner);
    });
  });
});
