const DungeonMain = Java.loadClass('com.robertx22.dungeon_realm.main.DungeonMain');
const DungeonEntityCap = Java.loadClass('com.robertx22.dungeon_realm.capability.DungeonEntityCapability');
const LibDatabase = Java.loadClass('com.robertx22.library_of_exile.database.init.LibDatabase');

EntityEvents.hurt(event => {
    const { entity: mob, source } = event;

    if (!mob.isLiving()) return;
    if (!source.player) return;
    if (mob.level.isClientSide()) return;

    let player = source.player;

    try {
        let dungeonCap = DungeonEntityCap.get(mob);

        if (!dungeonCap || !dungeonCap.data) return;

        let dungeonData = dungeonCap.data;

        let isDungeonEntity = dungeonData.isDungeonMob ||
            dungeonData.isDungeonEliteMob ||
            dungeonData.isMiniBossMob ||
            dungeonData.isFinalMapBoss;

        if (!isDungeonEntity) return;

        let mapDataOptional = DungeonMain.ifMapData(mob.level, mob.blockPosition());

        if (mapDataOptional && mapDataOptional.isPresent()) {
            let mapData = mapDataOptional.get();

            let mobTypeIcon = '';
            let mobTypeName = '';
            if (dungeonData.isFinalMapBoss) {
                mobTypeIcon = '§6⭐';
                mobTypeName = '§6보스';
            } else if (dungeonData.isMiniBossMob) {
                mobTypeIcon = '§d◆';
                mobTypeName = '§d미니보스';
            } else if (dungeonData.isDungeonEliteMob) {
                mobTypeIcon = '§b◇';
                mobTypeName = '§b엘리트';
            } else if (dungeonData.isDungeonMob) {
                mobTypeIcon = '§7○';
                mobTypeName = '§7일반';
            }

            // Rarity 색상 매핑
            let rarityColor = '§f';
            let rarityName = '';
            let rarity = mapData.current_mob_kill_rarity;
            if (rarity === 'common') {
                rarityColor = '§f';
                rarityName = '일반';
            } else if (rarity === 'uncommon') {
                rarityColor = '§a';
                rarityName = '고급';
            } else if (rarity === 'rare') {
                rarityColor = '§9';
                rarityName = '희귀';
            } else if (rarity === 'epic') {
                rarityColor = '§5';
                rarityName = '영웅';
            } else if (rarity === 'legendary') {
                rarityColor = '§6';
                rarityName = '전설';
            } else if (rarity === 'mythic') {
                rarityColor = '§c';
                rarityName = '신화';
            }

            let totalKills = mapData.mobKills + mapData.eliteKills + mapData.miniBossKills;
            try {
                let totalKillsWeighted = mapData.mobKills + (mapData.eliteKills * 10) + (mapData.miniBossKills * 20);
                let totalSpawnWeighted = mapData.mobSpawnCount + (mapData.eliteSpawnCount * 10) + (mapData.miniBossSpawnCount * 20);
                let killPercent = totalSpawnWeighted > 0 ? Math.round((totalKillsWeighted / totalSpawnWeighted) * 100) : 0;

                let nextRarityInfo = '';
                let canUpgradeRarity = false;
                try {
                    let currentRar = LibDatabase.MapFinishRarity().get(mapData.current_mob_kill_rarity);
                    if (currentRar && currentRar.getHigher().isPresent()) {
                        let higherRar = currentRar.getHigher().get();
                        let neededPercent = higherRar.perc_to_unlock;
                        let remainingPercent = neededPercent - killPercent;

                        let nextRarityColor = '§f';
                        let nextRarityName = '';
                        let nextRarityId = higherRar.GUID();

                        if (nextRarityId === 'uncommon') {
                            nextRarityColor = '§a';
                            nextRarityName = '고급';
                        } else if (nextRarityId === 'rare') {
                            nextRarityColor = '§9';
                            nextRarityName = '희귀';
                        } else if (nextRarityId === 'epic') {
                            nextRarityColor = '§5';
                            nextRarityName = '영웅';
                        } else if (nextRarityId === 'legendary') {
                            nextRarityColor = '§6';
                            nextRarityName = '전설';
                        } else if (nextRarityId === 'mythic') {
                            nextRarityColor = '§c';
                            nextRarityName = '신화';
                        }

                        if (remainingPercent > 0) {
                            nextRarityInfo = ' §8│ §7다음: ' + nextRarityColor + nextRarityName + ' §7(§f' + remainingPercent + '%§7 남음)';
                        } else {
                            nextRarityInfo = ' §8│ §a곧 다음 등급 달성 가능!';
                            canUpgradeRarity = true;
                        }
                    }
                } catch (e) {
                    console.log('정보 가져오기 실패: ' + e);
                }

                if (canUpgradeRarity) {
                    try {
                        mapData.updateMapCompletionRarity(player);
                    } catch (e) {
                        console.log('실행 실패: ' + e);
                    }
                }

                let mobName = mob.displayName.getString();
                let currentMobInfo = mobTypeIcon + ' ' + mobTypeName + ' §7: §f' + mobName + ' §8│ ';

                let actionBarText = currentMobInfo + '§e현재 Rarity: ' + rarityColor + rarityName +
                    ' §8│ §7Kills: §f' + totalKills + ' §7(일반:§f' + mapData.mobKills +
                    ' §7엘리트:§f' + mapData.eliteKills +
                    ' §7미니:§f' + mapData.miniBossKills + '§7)' +
                    ' §8│ §7Chests: §f' + mapData.lootedChests + '§7/§f' + mapData.totalChests +
                    ' §8│ §a진행률: §f' + killPercent + '%' +
                    nextRarityInfo;

                player.displayClientMessage(Text.of(actionBarText), true);
            } catch (e) {
                console.log('상세 정보 표시 실패: ' + e);
            }
        }

    } catch (e) {
        console.log('오류류: ' + e);
    }
});
