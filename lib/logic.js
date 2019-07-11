

/**
 * Sample transaction processor function.
 * @param {org.christianalva96.com.Trade} tx The sample transaction instance.
 * @transaction
 */

async function Trade(tx) {
    try {
        const NS = 'org.christianalva96.com';
        let asset = tx.commodity;
        let newShelter = tx.newOwner;

        asset.receiver = newShelter;
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
        let asset = tx.commodity;
        let cHistory = tx.cHistory;
    

         // Asset is out of Stock
        if (asset.availableQuantity == 0) {
            asset.currentState.state = "OUT_OF_STOCK";
            asset.commodityStateHist.push(asset.currentState);
        };
        if (asset.originalQuantity > asset.consumedQuantity && asset.availableQuantity > 0) {
            asset.consumedQuantity++;
            asset.availableQuantity--;
          	asset.commodityHist.push(cHistory);
        }

        let assetRegistry = await getAssetRegistry('org.christianalva96.com.Commodity');

        // Update the asset in the asset registry.
        await assetRegistry.update(asset);
    }
    catch (e) {

    }
}




/**
 * Sample transaction processor function.
 * @param {org.christianalva96.com.RefugeeShelterRelation} tx The sample transaction instance.
 * @transaction
 */
async function RefugeeShelterRelation(tx) {

        const NS = 'org.christianalva96.com';
  		let factory = getFactory();
        let asset = tx.shelterSpace;
        let rHistory = tx.history;
        let refugee = tx.refugee;
  
  		if (rHistory.shelterId != asset.shelterId) {
             console.log('History Shelter is not the same as Shelter');
        	return;
        }

        if (rHistory.state == 'DEPARTED') {
            asset.currentRefugeeCount--;
            // Remove the refugee from the array of current refugees
            asset.currentRefugees = asset.currentRefugees.filter((r => {
                r.userId !== refugee.userId;
            }))
            if (asset.currentRefugeeCount < asset.capacity && asset.currentState == 'FULL_CAPACITY') {
                asset.currentState == 'AVAILABLE'
                asset.sHistory.push(asset.currentState)
            }
            if (asset.currentState == 'OVER_CAPACITY' && asset.currentRefugeeCount == asset.capacity) {
                asset.currentState == 'FULL_CAPACITY'
                asset.sHistory.push(asset.currentState)
            }
        }

        if (rHistory.state == 'ARRIVED') {
          	if (asset.currentRefugees.some(r => r.userId === refugee.userId) > 0) {	
                console.log('Refugee Already Exists');
  				return;
			}
            asset.currentRefugeeCount++;
          	
            asset.currentRefugees.push(refugee);
            if (asset.currentRefugeeCount == asset.capacity && asset.currentState == 'AVAILABLE') {
                asset.currentState == 'FULL_CAPACITY'
                asset.sHistory.push(asset.currentState)
            }
            if (asset.currentState == 'FULL_CAPACITY' && asset.currentRefugeeCount > asset.capacity) {
                asset.currentState == 'OVER_CAPACITY'
                asset.sHistory.push(asset.currentState)
            }
        }

        let refugeeHistory = getAssetRegistry(`org.christianalva96.com.RefugeeHistory`);
        let assetRegistry = getAssetRegistry(`org.christianalva96.com.ShelterSpace`);

        Promise.all([refugeeHistory, assetRegistry]).then(async (data) => {

            // Update the asset in the asset registry.
            let recordExists = await data[0].exists(refugee.userId);
            console.log(recordExists);
          	console.log(rHistory);
            if (recordExists) {
                let _rHistory = await data[0].get(refugee.userId);
              	_rHistory.currentState = rHistory;
                _rHistory.refugeeHist.push(rHistory);
                await data[0].update(_rHistory);
            }else {
            	
               let _rHistory = factory.newResource('org.christianalva96.com','RefugeeHistory', refugee.userId);
               _rHistory.currentState = rHistory;
               _rHistory.refugeeHist = [rHistory];
               await data[0].add(_rHistory);
            } 
            await data[1].update(asset);
        }).catch((e) => {
            return e;
        })

}

/**
 * Sample transaction processor function.
 * @param {org.christianalva96.com.Donation} tx The sample transaction instance.
 * @transaction
 */
async function Donation(tx) {
    let factory = getFactory();
    let commodity = tx.commodity;
    let donator = tx.donator;
    let shelter = tx.shelter;

    let newCommodity = factory.newResource('org.christianalva96.com','Commodity', commodity.tradingSymbol);
    let cState = factory.newConcept('org.christianalva96.com','cStateHistory');
    cState.state = 'CREATED';
    newCommodity.description = commodity.description;
    newCommodity.originalQuantity = commodity.originalQuantity;
    newCommodity.availableQuantity = commodity.originalQuantity;
    newCommodity.consumedQuantity = 0;
    newCommodity.commodityStateHist = [];
    newCommodity.commodityHist = [];
    newCommodity.currentState = cState;
    newCommodity.donator = factory.newRelationship('org.christianalva96.com','Donator', donator.userId);
    newCommodity.receiver = factory.newRelationship('org.christianalva96.com','Shelter', shelter.shelterId);

    let commodityReg = await getAssetRegistry(`org.christianalva96.com.Commodity`);
    await commodityReg.add(newCommodity);
}

/**
 * Sample transaction processor function.
 * @param {org.christianalva96.com.StaffUpdate} tx The sample transaction instance.
 * @transaction
 */
async function StaffUpdate(tx) {
    let asset = tx.shelterSpace;
    let staff = tx.shelterParticipant;

    if (tx.updateState == 'ADD') {
       if (asset.currentRefugees.some(r => r.userId === refugee.userId) > 0) {	
            console.log('Staff Participant Already Exists');
            return;
        };
        asset.currentStaff.push(staff);
    }else {
        asset.currentStaff = asset.currentStaff.filter(v => {
            v.userId !== staff.userId;
        })
    }

    let shelterReg = await getAssetRegistry(`org.christianalva96.com.ShelterSpace`);
    await shelterReg.update(asset);
}

