const Crowdin = require('../crowdin');
const crowdin = new Crowdin(352655, 72);

async function applyTranslations(db) {
  const collection = db.collection('tierseasons');

  const seasonUID = 'tiers';
  const season = await collection.findOne({ uid: seasonUID });
  if (!season.__crowdin_etags) {
    season.__crowdin_etags = {};
  }


  const [translations, newEtags] = await crowdin.applyTranslations(season.__crowdin_etags);

  const update = {};

  for (const lang in translations) {
    const translation = translations[lang];
    update[`name.${lang}`] = translation.name;
    translation.tiers.forEach((tierTranslation, index) => {
      console.log(tierTranslation)
      update[`tiers.${index}.name.${lang}`] = tierTranslation.name;
      tierTranslation.criteria.forEach((criteriaTranslation, criteriaIndex) => {
        update[`tiers.${index}.criteria.${criteriaIndex}.title.${lang}`] = criteriaTranslation.title;
        update[`tiers.${index}.criteria.${criteriaIndex}.description.${lang}`] = criteriaTranslation.description;
      })
    });
    update[`__crowdin_etags.${lang}`] = newEtags[lang];
  }
  console.log(update)
  if (Object.entries(update).length > 0) {
    const updateResults = await collection.updateOne(
      { uid: seasonUID },
      { $set: update },
    );
    console.log(updateResults);
  }
}

async function buildSource(db) {
    const collection = db.collection('tierseasons');

    const seasonUID = 'tiers';
    const season = await collection.findOne({ uid: seasonUID });

    const localizationSource = {}

    localizationSource.name = season.name.en;
    localizationSource.tiers = season.tiers.map(tier => ({
      name: tier.name.en,
      criteria: tier.criteria.map(criteria => ({
        title: criteria.title.en,
        description: criteria.description.en,
      })),
    }));
    crowdin.updateSource(localizationSource);
}

module.exports = async function(db) {
  const action = process.argv[3];
  if (action === 'source') {
    await buildSource(db);
  } else if (action === 'translation') {
    await applyTranslations(db);
  } else {
    console.error('Action required! source | translation')
  }
}