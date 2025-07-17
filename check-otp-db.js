const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOtpCodes() {
  try {
    console.log('🔍 Vérification des codes OTP dans la base de données...\n');
    
    // Récupérer tous les codes OTP
    const otpCodes = await prisma.otpCode.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (otpCodes.length === 0) {
      console.log('❌ Aucun code OTP trouvé dans la base de données');
      return;
    }

    console.log(`✅ ${otpCodes.length} code(s) OTP trouvé(s) :\n`);

    otpCodes.forEach((otp, index) => {
      const isExpired = new Date() > new Date(otp.expiresAt);
      const status = otp.isUsed ? '❌ Utilisé' : (isExpired ? '⏰ Expiré' : '✅ Valide');
      
      console.log(`${index + 1}. Code OTP pour ${otp.user.email}:`);
      console.log(`   Code: ${otp.code}`);
      console.log(`   Type: ${otp.type}`);
      console.log(`   Statut: ${status}`);
      console.log(`   Créé: ${otp.createdAt.toLocaleString()}`);
      console.log(`   Expire: ${otp.expiresAt.toLocaleString()}`);
      console.log(`   Utilisateur: ${otp.user.name} (${otp.user.phone})`);
      console.log('');
    });

    // Vérifier les utilisateurs non vérifiés
    const unverifiedUsers = await prisma.user.findMany({
      where: {
        isVerified: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true
      }
    });

    if (unverifiedUsers.length > 0) {
      console.log(`⚠️  ${unverifiedUsers.length} utilisateur(s) non vérifié(s) :\n`);
      unverifiedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Créé: ${user.createdAt.toLocaleString()}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOtpCodes(); 