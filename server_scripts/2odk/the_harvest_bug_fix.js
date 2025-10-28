const HarvestEntityCap = Java.loadClass('com.robertx22.the_harvest.capability.HarvestEntityCap');
const MapDimensions = Java.loadClass('com.robertx22.library_of_exile.dimension.MapDimensions');
const HarvestConfig = Java.loadClass('com.robertx22.the_harvest.configs.HarvestConfig');
const ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation');
const HarvestEntries = Java.loadClass('com.robertx22.the_harvest.main.HarvestEntries');
const LootContextParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams');
const LootContextParamSets = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParamSets');
const LootParams = Java.loadClass('net.minecraft.world.level.storage.loot.LootParams');

EntityEvents.death(event => {
    const { entity: mob, source } = event;

    if (!mob.isLiving()) return;
    if (!source.player) return;
    if (mob.level.isClientSide()) return;

    let dimension = mob.level.dimension.toString();

    if (dimension === 'the_harvest:harvest') {
        let harvestCapability = HarvestEntityCap.get(mob);

        if (harvestCapability && harvestCapability.data) {
            let harvestData = harvestCapability.data;

            if (harvestData.isHarvestSpawn) {
                try {
                    let dimensionKey = new ResourceLocation(dimension);
                    let isMapDimension = MapDimensions.isMap(dimensionKey);

                    if (isMapDimension) {
                        let lootChance = HarvestConfig.get().LOOT_TABLE_CHANCE_PER_MOB.get().floatValue();
                        let chance = lootChance > 1 ? lootChance / 100 : lootChance;
                        if (Math.random() < chance) {
                            try {
                                let colorItems = [
                                    'the_harvest:lucid',
                                    'the_harvest:chaotic',
                                    'the_harvest:primal'
                                ];
                                let colorCount = Math.floor(Math.random() * 2) + 1;
                                for (let i = 0; i < colorCount; i++) {
                                    let randomItem = colorItems[Math.floor(Math.random() * colorItems.length)];
                                    mob.block.popItemFromFace(randomItem, 'up');
                                }

                                let foodItems = [
                                    'minecraft:wheat',
                                    'minecraft:beetroot',
                                    'minecraft:melon'
                                ];
                                let foodCount = Math.floor(Math.random() * 3) + 2;
                                for (let i = 0; i < foodCount; i++) {
                                    let randomFood = foodItems[Math.floor(Math.random() * foodItems.length)];
                                    mob.block.popItemFromFace(randomFood, 'up');
                                }

                            } catch (itemError) {
                                console.log(`오류: ${itemError}`);
                            }
                        }
                    }
                } catch (e) {
                    console.log(`오류: ${e}`);
                }
            }
        }
    }
});