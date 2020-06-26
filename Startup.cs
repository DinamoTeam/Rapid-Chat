using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
				Configuration.GetConnectionString("DefaultConnection")
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

			app.UseCors(x => x.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
			app.UseHttpsRedirection();
			app.UseMvc();
		}
	}
}
