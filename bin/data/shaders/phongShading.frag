#version 150

in vec3 vertexNormal;
in vec3 cameraSpacePosition;

out vec4 outputColor;

uniform Material
{
	vec4 diffuseColor;
	vec4 specularColor;
	float specularShininess;
} Mtl;

struct PerLight
{
	vec3 cameraSpaceLightPos;
	vec4 lightIntensity;
    float lightAttenuation;
};

const int maxNumberofLights = 512;

uniform Light
{
	vec4 ambientIntensity;
    int numberOfLights;
	PerLight lights[maxNumberofLights];
} Lgt;


float CalcAttenuation(in vec3 cameraSpacePosition,
	in vec3 cameraSpaceLightPos, in float lightAttenuation,
	out vec3 lightDirection)
{
	vec3 lightDifference =  cameraSpaceLightPos - cameraSpacePosition;
	float lightDistanceSqr = dot(lightDifference, lightDifference);
	lightDirection = lightDifference * inversesqrt(lightDistanceSqr);
	
	return (1 / ( 1.0 + lightAttenuation * sqrt(lightDistanceSqr)));
}

vec4 ComputeLighting(in PerLight lightData, in vec3 cameraSpacePosition,
	in vec3 cameraSpaceNormal)
{
	vec3 lightDir;
	vec4 lightIntensity;
	
	float atten = CalcAttenuation(cameraSpacePosition,
	lightData.cameraSpaceLightPos.xyz, lightData.lightAttenuation, lightDir);
	lightIntensity = atten * lightData.lightIntensity;

	vec3 surfaceNormal = normalize(cameraSpaceNormal);
	float cosAngIncidence = dot(surfaceNormal, lightDir);
	cosAngIncidence = clamp(cosAngIncidence,0,1);
	
	vec3 viewDirection = normalize(-cameraSpacePosition);
	
	vec3 halfAngle = normalize(lightDir + viewDirection);
	float angleNormalHalf = acos(dot(halfAngle, surfaceNormal));
	float exponent = angleNormalHalf / Mtl.specularShininess;
	exponent = -(exponent * exponent);
	float gaussianTerm = exp(exponent);
	
	vec4 lighting = Mtl.diffuseColor * lightIntensity * cosAngIncidence;
	lighting += Mtl.specularColor * lightIntensity * gaussianTerm;
	
	return lighting;
}

void main()
{
	vec4 accumLighting = Mtl.diffuseColor * Lgt.ambientIntensity;
	for(int light = 0; light < Lgt.numberOfLights; light++)
	{
		accumLighting += ComputeLighting(Lgt.lights[light],
			cameraSpacePosition, vertexNormal);
	}
	outputColor = accumLighting;
}