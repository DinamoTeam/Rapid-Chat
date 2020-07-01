using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Rapid_Chat.Data;

namespace RapidChat
{
	public class Startup
	{
		public Startup(IConfiguration configuration)
		{
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		public void ConfigureDevelopmentServices(IServiceCollection services)
		{
			services.AddDbContext<DataContext>(x => x.UseSqlite(
				Configuration.GetConnectionString("DefaultDevConnection")
			));
			ConfigureServices(services);
		}

		public void ConfigureProductionServices(IServiceCollection services)
		{
			services.AddDbContext<DataContext>(x => x.UseSqlServer(
				Configuration.GetConnectionString("DefaultConnection")
			));
			ConfigureServices(services);
		}
		public void ConfigureServices(IServiceCollection services)
		{
			services.AddCors();
			services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder app, IHostingEnvironment env)
		{
			if (env.IsDevelopment())
			{
				app.UseDeveloperExceptionPage();
			}
			else
			{
				app.UseHsts();
			}
			app.UseDeveloperExceptionPage();
			app.UseHttpsRedirection();
			app.UseCors(x => x.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());

			app.UseDefaultFiles();
			app.UseStaticFiles();
			app.UseMvc(routes =>
			{
				routes.MapSpaFallbackRoute(
					name: "spa-fallback",
					defaults: new { controller = "Fallback", action = "Index" }
				);
			});
		}
	}
}
