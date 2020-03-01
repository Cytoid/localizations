const axios = require('axios')
const crowdin = axios.create({
  baseURL: 'https://crowdin.com/api/v2',
  timeout: 1000,
  headers: {
    'Authorization': 'Bearer ' + process.env.CROWDIN_KEY
  }
});


class Crowdin {
  constructor (projectId, fileId) {
    this.projectId = projectId;
    this.fileId = fileId;
    this.langs = ['zh-CN'];
  }

  async updateSource(source) {
    const localizationSourceSerialized = JSON.stringify(source, null, 2);

    const res = await crowdin.post('/storages', localizationSourceSerialized, {
      headers: {
        'Content-Type': 'application',
        'Crowdin-API-FileName': 'tiers.json'
      }
    });
    console.log(res.data)
    const storageId = res.data.data.id;
    const response = (await crowdin.put(`/projects/${this.projectId}/files/${this.fileId}`, {
      storageId,
      updateOption: 'keep_translations_and_approvals',
    }))
    console.log(response.data)
  }

  async applyTranslation(lang, etag) {
    const headers = {}
    if (etag) {
      headers['If-None-Match'] = etag;
    }
    const response = await crowdin.post(`/projects/${this.projectId}/translations/builds/files/${this.fileId}`, {
      targetLanguageId: lang,
    }, {
      headers: headers,
      validateStatus: status => status < 400,
    });
    if (response.status == 304) {
      return;
    }
    const products = response.data.data;
    products.data = (await axios.get(products.url)).data;
    return products
  }

  async applyTranslations(etags) {
    const translations = {};
    const newEtags = {};
    for (const lang of this.langs) {
      const product = await this.applyTranslation(lang, etags[lang]);
      if (!product) {
        continue;
      }
      newEtags[lang] = product.etag;
      translations[lang] = product.data;
    }
    return [translations, newEtags];
  }
}

module.exports = Crowdin
