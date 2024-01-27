const Discord = require('discord.js');

const client = new Discord.Client({
    intents: [
        Object.keys(Discord.GatewayIntentBits)
    ],
});
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const DiscordStrategy = require('passport-discord').Strategy;
const ServerSettings = require('./Database/models/GuildSettings');
const bodyParser = require('body-parser');
const url = require('url');
const app = express();
const port = 3000; 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
passport.use(new DiscordStrategy({
    clientID: 'Id',
    clientSecret: '',
    callbackURL: 'http://localhost:3000/callback',
    scope: ['identify', 'guilds'],
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});



       
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

app.use(session({
    secret: '#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname, 'Dashboard', 'views'));
app.set('view engine', 'ejs');
app.get("/login", passport.authenticate('discord'), (req, res) => {
    // تحديد مسار العودة بشكل دينامي أو ثابت (اعتمادًا على متطلبات تطبيقك)
    req.session.returnTo = req.headers.referer || '/dashboard';
    res.redirect(req.session.returnTo);
});

app.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect(req.session.returnTo || '/dashboard');
        delete req.session.returnTo;
    }
);

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/'); // Redirect to the home page or any other desired page after logout
    });
});


const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    
    res.redirect('/login');
};



app.get('/', (req, res) => {
    res.render('index', {
            user: req.user,
            totalUsers: client.users.cache.size,
            totalGuilds: client.guilds.cache.size,
        });
});


app.get('/dashboard', checkAuth, async (req, res) => {
    let guilds = req.user.guilds.filter(g => g.permissions & 8);
    return res.render('guild', {
        user: req.user,
        guilds,
        bot: client,
    });
});


async function fetchServerStats(guild) {

    return {
        membersCount: guild.members.cache.size,
        rolesCount: guild.roles.cache.size,
    };
}
const createDefaultSettings = async (guildId) => {
    try {
        // افحص ما إذا كان هناك سيرفر بالفعل في قاعدة البيانات باستخدام guildId
        const existingSettings = await ServerSettings.findOne({ guildId });

        // إذا لم يكن هناك إعدادات بالفعل، قم بإنشاء إعدادات افتراضية
        if (!existingSettings) {
            const defaultSettings = {
                guildId: guildId,
                // اضف أي إعدادات أخرى تحتاجها
            };

            // قم بإنشاء الإعدادات في قاعدة البيانات
            await ServerSettings.create(defaultSettings);
        }
    } catch (error) {
        console.error('Error creating default settings:', error);
    }
};
async function fetchStoredSettingsFromDatabase(guildId) {
    try {
        // استعلام قاعدة البيانات للحصول على storedSettings
        const storedSettings = await ServerSettings.findOne({ guildId });
        return storedSettings || {}; // إذا لم يتم العثور على storedSettings، استرجع كائن فارغ
    } catch (error) {
        console.error('Error fetching storedSettings from database:', error);
        throw error;
    }
}

app.get('/server/:guildId', checkAuth, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        let guilds = req.user.guilds.filter(g => g.permissions & 8);

        const serverSettings = await ServerSettings.findOne({ guildId });

        const guild = client.guilds.cache.get(guildId);

        // التحقق من أن guild تم تحميله بشكل صحيح
        if (!guild) {
            throw new Error('Guild not found');
        }

        const serverStats = await fetchServerStats(guild);

        if (!serverSettings) {
            await createDefaultSettings(guildId);
        }

        // التحقق من وجود storedSettings
        const storedSettings = await fetchStoredSettingsFromDatabase(guildId);

        // التحقق من وجود storedSettings.leaves
        const leaves = storedSettings.leaves || [];

        const join1 = [];
        const leave1 = [];
        const join2 = [];
        const leave2 = [];
        
        // استخدام for-of loop بدلاً من forEach للتحقق من وجود user[1].joinedAt
        for (const user of guild.members.cache) {
            if (user[1].joinedAt) {
                let day = 7 * 86400000;
                let x = Date.now() - user[1].joinedAt;
                let created = Math.floor(x / 86400000);
            
                if (7 > created) {
                    join2.push(user[1].id);
                }
            
                if (1 > created) {
                    join1.push(user[1].id);
                }
            }
        }

        // استخدام الـ map بدلاً من forEach للتحقق من وجود timestamp في الرسائل
        leaves.map(async (leave) => {
            let xx = leave - Date.now();
            if (Date.now() > leave) {
                xx = Date.now() - leave;
            }

            let createdd = Math.floor(xx / 86400000);

            if (6 >= createdd) {
                leave2.push(leave);
            }

            if (0 >= createdd) {
                leave1.push(leave);
            }
        });

        // عدد الأعضاء في السيرفر
        const memberCount = guild.members.cache.size;

        // عدد الرولات في السيرفر
        const roleCount = guild.roles.cache.size;

        // عدد الرومات في السيرفر
        const channelCount = guild.channels.cache.size;
        let ownerName = 'Unknown';
        let ownerId = 'Unknown';
        
        // Check if guild has an owner and if the owner has a user property
        if (guild.owner && guild.owner.user) {
            ownerName = guild.owner.user.tag;
            ownerId = guild.ownerID;
        }

        res.render('dash/settings', {
            user: req.user,
            serverSettings,
            serverStats,
            guilds,
            guildId: guildId,
            bot: client,
            guild: guild,
            join1Count: join1.length,
            leave1Count: leave1.length,
            join2Count: join2.length,
            leave2Count: leave2.length,
            memberCount: memberCount, 
            roleCount: roleCount,     
            channelCount: channelCount,
            ownerName: ownerName,
            ownerId: ownerId
        });
    } catch (error) {
        console.error('Error in /server/:guildId route:', error);
        res.status(500).send('Internal Server Error');
    }
});


const welcomeSettings = require('./Database/models/welcomeSettings'); 

app.get('/server/:guildId/welcome', checkAuth, async (req, res) => {
    const guildId = req.params.guildId;
    let guilds = req.user.guilds.filter(g => g.permissions & 8);

    try {
        let serverSettings = await welcomeSettings.findOne({ guildId });

        if (!serverSettings) {
            serverSettings = await welcomeSettings.create({ guildId });
        }

        const guild = client.guilds.cache.get(guildId);

        res.render('dash/welcomeSettings', {
            user: req.user,
            serverSettings,
            guild,
            guildId,
            guilds,
            bot: client,
        });

    } catch (error) {
        console.error('Error fetching welcome settings:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/server/:guildId/welcome', checkAuth, async (req, res) => {
    const guildId = req.params.guildId;
    const { welcomeChannel, welcomeMessage, leaveChannel, leaveMessage } = req.body;
    const isCodeEnabled = Boolean(req.body.isCodeEnabled);
    const isCodeEnabledLeave = Boolean(req.body.isCodeEnabledLeave);

    try {
        const updatedSettings = await welcomeSettings.findOneAndUpdate(
            { guildId },
            { $set: { welcomeChannel, welcomeMessage, isCodeEnabled, leaveChannel, leaveMessage, isCodeEnabledLeave } },
            { new: true, upsert: true }
        );
        
        res.redirect(`/server/${guildId}/welcome`);
    } catch (error) {
        console.error('Error updating welcome settings:', error);
        res.status(500).send('Internal Server Error');
    }
});

const AutoRoleModel = require('./Database/models/AutoRole');

app.get('/server/:guildId/AutoRole', checkAuth, async (req, res) => {
    const guildId = req.params.guildId;
    let guilds = req.user.guilds.filter(g => g.permissions & 8);

    let serverSettings = await AutoRoleModel.findOne({ guildId });
    if (!serverSettings) {
        serverSettings = await AutoRoleModel.create({ guildId });
    }
    const guild = client.guilds.cache.get(guildId);
    res.render('dash/AutoRole', {
        user: req.user,
        serverSettings,
        guild,
        guildId,
        guilds,
        bot: client,
    });
});


app.post('/server/:guildId/AutoRole', checkAuth, async (req, res) => {
    const guildId = req.params.guildId;
    const { selectedRole1, selectedRole2, isCodeEnabled } = req.body;

    try {
        const autoRoleData = await AutoRoleModel.findOneAndUpdate(
            { guildId: guildId },
            { $set: { selectedRole1, selectedRole2, isCodeEnabled: !!isCodeEnabled } },
            { upsert: true, new: true }
        );

        res.redirect(`/server/${guildId}/AutoRole`);
    } catch (error) {
        console.error(error);
        res.status(500).send('حدث خطأ أثناء حفظ الرتب وحالة الكود.');
    }
});


app.listen(port, () => {
    console.log(`Dashboard is running at http://localhost:${port}`);
});
client.login('Token');