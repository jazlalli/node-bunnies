var message = {
    create : function (url, payload) {
        return {
            url: url,
            ipaddress: payload.REMOTE_ADDR,
            useragent: payload.HTTP_USER_AGENT,
            site: payload.mi_urlinfo_site,
            product: payload.mi_urlinfo_product,
            pagetype: payload.mi_urlinfo_type,
            mediasource: payload.MediaSource,
            campaign: payload.Campaign,
            adgroup: payload.AdGroup,
            referrer: payload.Referrer,
            userid: payload['MI-LifeTimeCookie'],
            createtime: payload.CreateTime,
            latitude: payload.latitude,
            longitude: payload.longitude
        };
    }
};

module.exports = message;