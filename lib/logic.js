

/**
 * Sample transaction processor function.
 * @param {org.christianalva96.com.Trade} tx The sample transaction instance.
 * @transaction
 */

async function Trade(tx) {
    try {
        let asset = tx.commodity;
        let newShelter = tx.newOwner;

        asset.shelter = newShelter;
        let assetRegistry = await getAssetRegistry(`${NS}.Commodity`);
        // Update the asset in the asset registry.
        await assetRegistry.update(asset);
    }
    catch (e) {

    }
}

/**
 * Sample transaction processor function.
 * @param {org.christianalva96.com.Consumption} tx The sample transaction instance.
 * @transaction
 */
async function Consumption(tx) {
    const NS = 'org.christianalva96.com';

    try {
        let asset = tx.commity;
        let scanner = tx.shelterParticipant;
        let consumer = tx.consumer;

         // Asset is out of Stock
         if (asset.availableQuantity == 0) {
            asset.currentState = 'OUT_OF_STOCK';
            asset.cHistory.push({
                'state': asset.currentState ,
                'updateTime': Date.now()
            }) 

            return;
        };
        if (asset.originalQuantity > asset.consumedQuantity + 1 && asset.availableQuantity > 0) {
            asset.consumedQuantity++;
            asset.availableQuantity--;
        } else {
            return; 
        }

        asset.cHistory.push({
            'giver' : scanner,
            'consumer': consumer,
            'updateTime': Date.now()
        });
       
        let assetRegistry = await getAssetRegistry(`${NS}.Commodity`);

        // Update the asset in the asset registry.
        await assetRegistry.update(asset);
    }
    catch (e) {

    }
}

/**
 * Donation Transaction should add the new Commodity to the shelter
 * @param {org.christianalva96.com.Donation} tx The sample transaction instance.
 * @transaction
 */


/**
 * Sample transaction processor function.
 * @param {org.christianalva96.com.RefugeeShelterRelation} tx The sample transaction instance.
 * @transaction
 */
async function RefugeeShelterRelation(tx) {
    try {
        let asset = tx.shelterSpace;
        let rHistory = tx.rHistory;
        let refugee = tx.refugee;

        if (rHistory.rState == 'DEPARTED') {
            asset.currentRefugeeCount--;
            // Remove the refugee from the array of current refugees
            asset.currentRefugees = asset.currentRefugees.filter((r => {
                r.userID === refugee.userID;
            }), 1)
            if (asset.currentRefugeeCount < asset.capacity && asset.currentState == 'FULL_CAPACITY') {
                asset.currentState == 'AVAILABLE'
                asset.sHistory.push({
                    'state' : asset.currentState,
                    'updateTime' : Date.now()
                })
            }
            if (asset.currentState == 'OVER_CAPACITY' && asset.currentRefugeeCount == asset.capacity) {
                asset.currentState == 'FULL_CAPACITY'
                asset.sHistory.push({
                    'state' : asset.currentState,
                    'updateTime' : Date.now()
                })
            }
        }

        if (rHistory.rState == 'ARRIVED') {
            asset.currentRefugeeCount++;
            asset.push(refugee);
            if (asset.currentRefugeeCount == asset.capacity && asset.currentState == 'AVAILABLE') {
                asset.currentState == 'FULL_CAPACITY'
                asset.sHistory.push({
                    'state' : asset.currentState,
                    'updateTime' : Date.now()
                })
            }
            if (asset.currentState == 'FULL_CAPACITY' && asset.currentRefugeeCount > asset.capacity) {
                asset.currentState == 'OVER_CAPACITY'
                asset.sHistory.push({
                    'state' : asset.currentState,
                    'updateTime' : Date.now()
                })
            }
        }

        let refugeeHistory = getAssetRegistry(`${NS}.RefugeeHistory`);
        let assetRegistry = getAssetRegistry(`${NS}.ShelterSpace`);

        Promise.all([refugeeHistory, assetRegistry]).then((data) => {

            // Update the asset in the asset registry.
            let recordExists = await data[0].exists(refugee.userID);
            if (recordExists) {
                let _rHistory = await data.get(refugee.userID);
                _rHistory.push(rHistory);
                await data[0].update(newLoan);
            }else {
                let _rHistory = factory.newResource(NS,'RefugeeHistory', refugee.userID);
                _rHistory.push(rHistory);
                await data[0].add(newLoan);
            }
            await data[1].update(asset);
        })
    }
    catch (e) {

    }
}
