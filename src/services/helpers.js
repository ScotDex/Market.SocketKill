const axios = require('axios');
require('dotenv').config();

class DiscoveryService {
static async getBackPhoto(){
        try {
            const url = (process.env.BACKGROUND_API);
            if (!url) throw new Error ("Background API not defined in .env")
            const response = await axios.get(url)

            return{
                url: response.data.url,
                title: response.data.name.split('.')[0].replace(/_/g, ' '),
                media_type: 'image'
            };

        } catch (err) {
            console.error("Background Pic Retrieval Issue", err.message);
            return {
                url: '/assets/fail_over.jpg',
                title: 'deepspace',
                media_type: 'image'
        };             
    }
}

}

module.exports = DiscoveryService