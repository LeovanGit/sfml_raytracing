struct Plane
{
    vec3 normal;
    float d;
    vec3 color;
    int material;
};

float is_intersect_plane(Plane plane, vec3 camera, vec3 ray)
{
    return -(plane.d + dot(camera, plane.normal)) / (dot(plane.normal, ray));
}

struct Sphere
{
    float radius;
    vec3 center;
    vec3 color;
    int material;
};

float is_intersect_sphere(Sphere sphere, vec3 camera, vec3 ray)
{
    vec3 v = sphere.center - camera;
    float len_v = length(v);
    float pr_v = dot(v, normalize(ray));
    float sq_l = len_v * len_v - pr_v * pr_v;
    float sq_radius = sphere.radius * sphere.radius;
    if (sq_l > sq_radius) return -1.0;
    float x = sqrt(sq_radius - sq_l);
    return pr_v - x;
}
