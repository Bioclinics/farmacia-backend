import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	
	const config = new DocumentBuilder()
		.setTitle('Backend de farmacia')
		.setDescription('Backend dedicado unicamente a servicio de farmacia')
		.setVersion('1.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
			},
			'access-token',
		)
		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/documentation', app, documentFactory);

	app.enableCors({
		origin: '*',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		allowedHeaders: '*',
	});
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
