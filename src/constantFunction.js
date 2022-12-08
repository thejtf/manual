import CONFIG from "./config";

// 计算指定时间与当前的时间差
const getLastEditedTime = (dateBegin) => {

    dateBegin = new Date(dateBegin)

    let dateEnd = new Date();

    // 时间差的毫秒数
    let dateDiff = dateEnd.getTime() - dateBegin.getTime()
    // 时间差的天数
    let dayDiff = Math.floor(dateDiff / (24 * 3600 * 1000))

    // 计算除天数外剩余的毫秒数
    let leave1 = dateDiff % (24 * 3600 * 1000)
    // 小时数
    let hours = Math.floor(leave1 / (3600 * 1000))

    // 计算除小时剩余的分钟数
    let leave2 = leave1 % (3600 * 1000)
    // 分钟数
    let minutes = Math.floor(leave2 / (60 * 1000))

    //计算相差的秒数
    let leave3 = leave2 % (60 * 1000)
    let seconds = Math.round(leave3 / 1000)

    return { 'day': dayDiff, 'hours': hours, 'minutes': minutes, 'seconds': seconds }

}

// 处理网易云音乐
// 输入 markdown 格式的 URL，例如 [xxx](http:....)，返回网易云音乐的 iframe HTML
const setNeteaseMusic = (custom_old_card) => {
    // 判断类型是歌曲还是歌单
    let type = 2 //歌曲
    let height_1 = 52
    let height_2 = 32
    if (custom_old_card.indexOf('playlist') > -1 || custom_old_card.indexOf('album') > -1) {
        
        height_1 = 110
        height_2 = 90

        if(custom_old_card.indexOf('playlist') > -1){
            type = 0 // 歌单
        }
        if(custom_old_card.indexOf('album') > -1){
            type = 1 // 专辑
        }
    }

    // 获取歌曲 ID
    let music_id_reg = /[0-9]{4,14}/g
    let music_id_list = custom_old_card.match(music_id_reg)

    if (music_id_list !== [] && music_id_list!==null) {
        // 匹配到 ID
        let music_id = music_id_list[0]
        let netease_music_iframe = '<div class="music netease_music"><iframe frameborder="no" border="0" marginwidth="0" marginheight="0" height=' + height_1 + ' style="width: 100%; " src="//music.163.com/outchain/player?type=' + type + '&id=' + music_id + '&auto=0&height='+height_2+'"></iframe></div>'

        return netease_music_iframe

    } else {
        return undefined
    }

}

// 修复单个 md 文件中的 img
const getClearImag = (card) => {

    // 修改图片后缀，避免图片无法显示
    // 找到 ![]( 符号
    // 找到上述符号之后的第 1 个 jpg#/png#/gif# 符号
    // 找到上一个步骤后的第 1 个 ) 符号
    // 删除前面 2 步 index 中间的符号

    console.log('getClearImag');

    let content = card['content']

    // 支持的图片类型
    let img_type = ['.png', '.jpeg', '.jpg', '.gif']
    // 包含以下关键字则认为是图片
    let img_keyword_index = content.indexOf('![')

    while (img_keyword_index !== -1) {


        // 获取下一个 ) 索引
        let img_end_inex = content.indexOf(')', img_keyword_index)

        // 获取下一个 ] 索引
        let img_alt_end_inex = content.indexOf(']', img_keyword_index)

        // 获取图片扩展名索引
        let img_etc_index
        for (let i = 0; i < img_type.length; i++) {
            img_etc_index = content.indexOf(img_type[i], img_keyword_index + 1)
            if (img_etc_index >= 0 && img_etc_index <= img_end_inex) {

                // 如果格式字符是这种格式 ![....jpg] 内，则跳过
                if (content.substring(img_etc_index + img_type[i].length, img_etc_index + img_type[i].length + 2) === '](') {
                    img_etc_index = content.indexOf(img_type[i], img_etc_index + 1)

                }

                img_etc_index += img_type[i].length
                break;


            }
        }

        if (img_keyword_index === -1 || img_end_inex === -1 || img_etc_index === -1) {
            break
        }

        let img_alt = content.substring(img_keyword_index + 2, img_alt_end_inex)
        let img_src = content.substring(img_alt_end_inex + 2, img_etc_index)

        console.log('image keyword');
        console.log(img_alt);
        console.log(img_src);

        let old_img_str = content.substring(img_keyword_index, img_end_inex + 1)


        // 获取 = 索引
        let img_width_inex = old_img_str.indexOf('=')

        if (img_width_inex > -1 && old_img_str.indexOf('{{width') < 0) {
            //将图片宽度保存到 alt 中
            img_alt = img_alt + '{{width ' + old_img_str.substring(img_width_inex + 1, old_img_str.length - 2) + '}}'
        }

        let new_img_str = '![' + img_alt + '](' + img_src + ')'

        content = content.replace(old_img_str, new_img_str)

        // 获取 ![ 索引
        img_keyword_index = content.indexOf('![', img_keyword_index + 1)


    }
    card['content'] = content
    return card

}

// 处理单个 md 文件中的超链接
const getClearCard = (card, cards) => {
    console.log('getClearCard');
    // 找到 (./ 符号以及之后的第 1 个 ，或找到 {{ 符号 }}) 符号，截取这 2 个 index 中间的字符串
    // 将上述字符串放在 card 数据中匹配
    // 如果找到匹配的卡片：修改上述字符串的地址为 /post/post.id
    let content = card['content']
    let this_card_id = card['id']


    // 获取 {{ 符号
    let card_keyword_index = content.indexOf('{{')

    while (card_keyword_index !== -1) {

        //获取卡片末尾的索引
        let card_end_inex = content.indexOf('}}', card_keyword_index)

        if (card_keyword_index === -1 || card_end_inex === -1) {
            break
        }

        let old_card = content.substring(card_keyword_index, card_end_inex + 2)
        // {{card xxxx-xxx-xxxx}}
        let new_card = '<span class="unknown_card">{{未知卡片}}</span>'

        // 检验一下的确是 card
        if (old_card.indexOf('card ') >= 0) {

            // 根据 ID 匹配数据中是否存在此卡片

            for (let i = 0; i < cards.length; i++) {

                // 处理当前卡片信息
                if (old_card.indexOf(cards[i]['id']) >= 0) {
                    // 存在：设置卡片链接
                    // new_card = '[' + cards[i]['title'] + ']' + '(' + '/post/' + cards[i]['id'] + ')'

                    // path 参数用于点击时加载对应笔记的数据，只有 my_link 类可点击
                    new_card = '<span class="my_link article_link" parent_note_id='+this_card_id+' path=/post/'+ cards[i]['id'] + '>' + cards[i]['title'] + '</span>'
                    break
                }


            }

            content = content.replace(old_card, new_card)


        } else {

        }

        card_keyword_index = content.indexOf('{{', card_keyword_index + 1)

    }


    // 获取拥有别名的卡片
    let custom_card_keyword_index = content.indexOf('[')
    // console.log(custom_card_keyword_index);
    while (custom_card_keyword_index !== -1) {


        if (content[custom_card_keyword_index - 1] === '!') {
            // 如果是图片则忽略

        } else {

            // ] 符号
            let custom_card_name_end_inex = content.indexOf(']', custom_card_keyword_index)

            //获取卡片末尾的索引
            let custom_card_end_inex = content.indexOf(')', custom_card_keyword_index)

            let custom_old_card = content.substring(custom_card_keyword_index, custom_card_end_inex + 1)

            if (custom_old_card.indexOf(']') < 0 || content[custom_card_name_end_inex + 1] !== '(') {



            } else {

                let custom_card_name = content.substring(custom_card_keyword_index + 1, custom_card_name_end_inex)
                let custom_card_url = content.substring(custom_card_name_end_inex, custom_card_end_inex)
                // [name](./url)

                if (custom_card_url.indexOf('./') < 0 || custom_card_url.indexOf('.md') < 0) {
                    // 如果不是 Heptabase 内部链接，则判断是否为音乐链接
                    if (custom_old_card.indexOf('https://music.163.com/') > -1) {
                        // 网易云音乐
                        let netease_music_iframe = setNeteaseMusic(custom_old_card)
                        if (netease_music_iframe !== undefined) {
                            content = content.replace(custom_old_card, netease_music_iframe)
                        }

                    }


                } else {
                    // 卡片默认跳转到 404 页面
                    let custom_new_card = '<a class="unknown_card" href=/404/>' + custom_card_name + '</a>'

                    // 根据 ID 匹配数据中是否存在此卡片

                    for (let i = 0; i < cards.length; i++) {

                        if (custom_old_card.indexOf(cards[i]['id']) >= 0) {
                            // 存在：设置卡片链接
                            custom_new_card = '<span class="my_link article_link" parent_note_id='+this_card_id+' path=/post/' + cards[i]['id'] + '>' + custom_card_name + '</span>'
                            break
                        }

                    }

                    // console.log('custom_new_card:');
                    // console.log(custom_new_card);

                    content = content.replace(custom_old_card, custom_new_card)
                }

            }



        }

        custom_card_keyword_index = content.indexOf('[', custom_card_keyword_index + 1)

    }

    // 处理网易云音乐
    let netease_music_keyword_index = content.indexOf('<https://music.163.com/')
    while (netease_music_keyword_index > -1) {
        // 获取链接的结尾
        let netease_music_end_inex = content.indexOf('>', netease_music_keyword_index)
        // 原始文本
        let netease_music_old_url = content.substring(netease_music_keyword_index, netease_music_end_inex + 1)

        // // 获取歌曲 ID
        // let music_id_reg = /[0-9]{4,14}/g
        // let music_id_list = netease_music_old_url.match(music_id_reg)

        // if (music_id_list !== []) {
        //     // 匹配到 ID
        //     let music_id = music_id_list[0]
        //     let netease_music_iframe = '<div class="music netease_music"><iframe frameborder="no" border="0" marginwidth="0" marginheight="0" height=52 style="width: 100%; " src="//music.163.com/outchain/player?type=2&id=' + music_id + '&auto=0&height=32"></iframe></div>'
        //     content = content.replace(netease_music_old_url, netease_music_iframe)
        //     // 
        // }

        // 网易云音乐
        let netease_music_iframe = setNeteaseMusic(netease_music_old_url)
        if (netease_music_iframe !== undefined) {
            content = content.replace(netease_music_old_url, netease_music_iframe)
        }


        netease_music_keyword_index = content.indexOf('<https://music.163.com/song?', netease_music_keyword_index + 1)


    }

    // 处理反向连接
    // 如果 A 卡片中存在当前笔记的 ID，则 A 卡片为当前笔记的反向链接之一
    let backLinks = []
    for (let i = 0; i < cards.length; i++) {

        if (cards[i]['content'].indexOf(this_card_id) >= 0 && cards[i]['id'] !== this_card_id) {

            backLinks.push(cards[i])

        }

    }

    card['content'] = content
    return { 'card': card, 'backLinks': backLinks }

}

// 获取 Heptabase 的笔记数据
const getHeptabaseData = new Promise((resolve, reject) => {

    console.log('getHeptabaseData');

    // 获取本地数据
    let heptabase_blog_data = localStorage.getItem("heptabase_blog_data")

    // 若本地存在数据则不重新获取
    if (heptabase_blog_data !== undefined) {

        let createdTime = JSON.parse(heptabase_blog_data)['createdTime']
        console.log(Date.parse(new Date()) / 1000);
        console.log(createdTime);
        console.log(Date.parse(new Date()) / 1000 - createdTime);

        //Date.parse(new Date()) / 1000 - createdTime >= 1200 && createdTime !== undefined
        if (Date.parse(new Date()) / 1000 - createdTime >= 1200 && createdTime !== undefined) {
            // 数据比较旧时再重新获取
            console.log('数据比较旧');

        } else {
            console.log('从缓存获取数据');
            // return heptabase_blog_data
            resolve(JSON.parse(heptabase_blog_data))
            return
        }


    }

    console.log('heptabase_blog_data == undefined');

    const header = new Headers({ "Access-Control-Allow-Origin": "*" });

    // 获取 Heptabase 数据
    fetch(CONFIG.api_url, {
        method: "get",
        header: header
        // mode: 'no-cors'
    })
        .then(res => res.json())
        .then(data => {
            console.log(data)

            // 按照时间排序卡片
            data.cards = data.cards.sort((a, b) => {

                // 最近编辑时间
                return b.lastEditedTime < a.lastEditedTime ? -1 : 1

            })

            let pages = {}
            // 获取 About、Projects 页面的数据
            pages.about = undefined
            pages.projects = undefined

            for (let i = 0; i < data.cards.length; i++) {
                console.log(data.cards[i]['title']);

                // About
                if (data.cards[i]['title'] === 'About') {

                    pages.about = data.cards[i]

                }

                // Projects
                if (data.cards[i]['title'] === 'Projects') {
                    pages.projects = data.cards[i]

                }

                // 最近编辑的时间差
                // getLastEditedTime(format(new Date(data.cards[i]['lastEditedTime']), 'yyyy-MM-dd'))
                let timeDiff = getLastEditedTime(data.cards[i]['lastEditedTime'])
                data.cards[i].lastEditedTimeDiff = ''
                if (timeDiff['day'] > 0) {
                    data.cards[i].lastEditedTimeDiff = 'Edited ' + timeDiff['day'] + ' days ago'
                } else if (timeDiff['hours'] > 0) {

                    data.cards[i].lastEditedTimeDiff = 'Edited ' + timeDiff['hours'] + ' hours ago'

                } else if (timeDiff['minutes'] > 0) {

                    data.cards[i].lastEditedTimeDiff = 'Edited ' + timeDiff['minutes'] + ' minutes ago'

                } else {

                    data.cards[i].lastEditedTimeDiff = 'Edited just'

                }
            }

            // createdTime 记录数据获取的时间
            const local_data = { 'createdTime': Date.parse(new Date()) / 1000, 'data': data, 'pages': pages }
            // 存储数据到本地缓存
            localStorage.setItem("heptabase_blog_data", JSON.stringify(local_data))
            // console.log(this.state.posts);

            console.log('getHeptabaseData return');
            // return heptabase_blog_data
            resolve(local_data)
        })
        .catch(e => console.log('错误:', e))

})


export { getHeptabaseData, getClearImag, getClearCard }