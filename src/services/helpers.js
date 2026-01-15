    static async getBackPhoto(){
        try {
            const url = (process.env.BACKGROUND_API_URL);
            const response = await axios.get(url)

            return{
                url: response.data.url,
                title: response.data.name.split('.')[0].replace(/_/g, ' '),
                media_type: 'image'
            };

        } catch (err) {
            console.error("Background Pic Retrieval Issue", err.message);
            return null;            
        }
    }